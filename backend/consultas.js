const pool = require("./db");

/* =====================================================
   CONEXIÓN - PROBAR CONEXIÓN CON POSTGRESQL
===================================================== */

async function probarConexion() {
  const resultado = await pool.query("SELECT NOW() AS fecha_actual");
  return resultado.rows[0];
}

/* =====================================================
   PRODUCTOS - LEER PRODUCTOS DISPONIBLES
===================================================== */

async function obtenerProductos() {
  const resultado = await pool.query(`
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.imagen,
      p.disponible,
      p.stock,
      c.nombre AS categoria
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.disponible = true
    ORDER BY p.id_producto;
  `);

  return resultado.rows;
}

/* =====================================================
   PRODUCTOS - LEER UN PRODUCTO POR ID
===================================================== */

async function obtenerProductoPorId(idProducto) {
  const resultado = await pool.query(
    `
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.imagen,
      p.disponible,
      c.nombre AS categoria
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = $1;
    `,
    [idProducto],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - LEER USUARIO POR CORREO
===================================================== */

async function buscarUsuarioPorCorreo(correo) {
  const resultado = await pool.query(
    `
    SELECT 
      id_usuario,
      nombre,
      correo,
      password,
      estado,
      fecha_registro
    FROM usuarios
    WHERE correo = $1;
    `,
    [correo],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - CREAR / REGISTRAR USUARIO
===================================================== */

async function registrarUsuario(nombre, correo, passwordEncriptado) {
  const resultado = await pool.query(
    `
    INSERT INTO usuarios (nombre, correo, password, estado)
    VALUES ($1, $2, $3, 'Activo')
    RETURNING 
      id_usuario,
      nombre,
      correo,
      estado,
      fecha_registro;
    `,
    [nombre, correo, passwordEncriptado],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - ACTUALIZAR ESTADO DEL USUARIO
   Ejemplo: Activo / Inhabilitado
===================================================== */

async function actualizarEstadoUsuario(idUsuario, nuevoEstado) {
  const resultado = await pool.query(
    `
    UPDATE usuarios
    SET estado = $1
    WHERE id_usuario = $2
    RETURNING 
      id_usuario,
      nombre,
      correo,
      estado;
    `,
    [nuevoEstado, idUsuario],
  );

  return resultado.rows[0];
}

/* =====================================================
   PEDIDOS - CREAR / REGISTRAR PEDIDO
===================================================== */

async function guardarPedido(datosPedido) {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const {
      id_usuario,
      cliente_nombre,
      cliente_correo,
      cliente_telefono,
      direccion,
      metodo_pago,
      descuento,
      productos,
    } = datosPedido;

    const productosAgrupados = [];

    productos.forEach(function (producto) {
      const productoExistente = productosAgrupados.find(function (item) {
        return Number(item.id_producto) === Number(producto.id_producto);
      });

      if (productoExistente) {
        productoExistente.cantidad =
          Number(productoExistente.cantidad) + Number(producto.cantidad);
      } else {
        productosAgrupados.push({
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio: Number(producto.precio),
          cantidad: Number(producto.cantidad),
        });
      }
    });

    for (const producto of productosAgrupados) {
      if (!producto.id_producto) {
        const error = new Error(
          "Todos los productos deben tener un ID válido.",
        );
        error.statusCode = 400;
        throw error;
      }

      if (producto.cantidad <= 0) {
        const error = new Error("La cantidad de un producto no es válida.");
        error.statusCode = 400;
        throw error;
      }

      const productoBD = await cliente.query(
        `
        SELECT 
          id_producto,
          nombre,
          stock,
          disponible
        FROM productos
        WHERE id_producto = $1
        FOR UPDATE;
        `,
        [producto.id_producto],
      );

      if (productoBD.rows.length === 0) {
        const error = new Error("Uno de los productos no existe.");
        error.statusCode = 404;
        throw error;
      }

      const productoEncontrado = productoBD.rows[0];

      if (!productoEncontrado.disponible) {
        const error = new Error(
          "El producto " + productoEncontrado.nombre + " no está disponible.",
        );
        error.statusCode = 400;
        throw error;
      }

      if (Number(productoEncontrado.stock) < Number(producto.cantidad)) {
        const error = new Error(
          "No hay stock suficiente para " +
            productoEncontrado.nombre +
            ". Stock actual: " +
            productoEncontrado.stock,
        );
        error.statusCode = 400;
        throw error;
      }
    }

    let subtotal = 0;

    productosAgrupados.forEach(function (producto) {
      subtotal += Number(producto.precio) * Number(producto.cantidad);
    });

    const porcentajeDescuento = Number(descuento || 0);
    const total = subtotal - subtotal * porcentajeDescuento;

    const pedidoResultado = await cliente.query(
      `
      INSERT INTO pedidos (
        id_usuario,
        cliente_nombre,
        cliente_correo,
        cliente_telefono,
        direccion,
        metodo_pago,
        total,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pendiente')
      RETURNING 
        id_pedido,
        total,
        estado,
        fecha_pedido;
      `,
      [
        id_usuario || null,
        cliente_nombre || null,
        cliente_correo || null,
        cliente_telefono || null,
        direccion || null,
        metodo_pago || null,
        total,
      ],
    );

    const idPedido = pedidoResultado.rows[0].id_pedido;

    for (const producto of productosAgrupados) {
      const precio = Number(producto.precio);
      const cantidad = Number(producto.cantidad);
      const subtotalProducto = precio * cantidad;

      await cliente.query(
        `
        INSERT INTO detalle_pedido (
          id_pedido,
          id_producto,
          nombre_producto,
          cantidad,
          precio_unitario,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6);
        `,
        [
          idPedido,
          producto.id_producto,
          producto.nombre,
          cantidad,
          precio,
          subtotalProducto,
        ],
      );

      await cliente.query(
        `
        UPDATE productos
        SET stock = stock - $1
        WHERE id_producto = $2;
        `,
        [cantidad, producto.id_producto],
      );
    }

    await cliente.query("COMMIT");

    return {
      id_pedido: idPedido,
      subtotal: subtotal,
      descuento: porcentajeDescuento,
      total: total,
      estado: "Pendiente",
      fecha_pedido: pedidoResultado.rows[0].fecha_pedido,
    };
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

/* =====================================================
   PEDIDOS - LEER / LISTAR TODOS LOS PEDIDOS
===================================================== */

async function listarPedidos() {
  const resultado = await pool.query(`
    SELECT 
      id_pedido,
      id_usuario,
      cliente_nombre,
      cliente_correo,
      cliente_telefono,
      direccion,
      metodo_pago,
      total,
      estado,
      fecha_pedido
    FROM pedidos
    ORDER BY id_pedido DESC;
  `);

  return resultado.rows;
}

/* =====================================================
   PEDIDOS - LEER UN PEDIDO POR ID
===================================================== */

async function obtenerPedidoPorId(idPedido) {
  const resultado = await pool.query(
    `
    SELECT 
      id_pedido,
      id_usuario,
      cliente_nombre,
      cliente_correo,
      cliente_telefono,
      direccion,
      metodo_pago,
      total,
      estado,
      fecha_pedido
    FROM pedidos
    WHERE id_pedido = $1;
    `,
    [idPedido],
  );

  return resultado.rows[0];
}

/* =====================================================
   PEDIDOS - LEER DETALLE DE UN PEDIDO
===================================================== */

async function obtenerDetallePedido(idPedido) {
  const resultado = await pool.query(
    `
    SELECT 
      id_detalle,
      id_pedido,
      id_producto,
      nombre_producto,
      cantidad,
      precio_unitario,
      subtotal
    FROM detalle_pedido
    WHERE id_pedido = $1
    ORDER BY id_detalle;
    `,
    [idPedido],
  );

  return resultado.rows;
}

/* =====================================================
   PEDIDOS - ACTUALIZAR ESTADO DEL PEDIDO
   Ejemplo: Pendiente / Preparando / Enviado / Entregado / Cancelado
===================================================== */

async function actualizarEstadoPedido(idPedido, nuevoEstado) {
  const resultado = await pool.query(
    `
    UPDATE pedidos
    SET estado = $1
    WHERE id_pedido = $2
    RETURNING 
      id_pedido,
      cliente_nombre,
      total,
      estado,
      fecha_pedido;
    `,
    [nuevoEstado, idPedido],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - ACTUALIZAR NOMBRE
===================================================== */

async function actualizarNombreUsuario(idUsuario, nuevoNombre) {
  const resultado = await pool.query(
    `
    UPDATE usuarios
    SET 
      nombre = $1,
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_usuario = $2
    RETURNING 
      id_usuario,
      nombre,
      correo,
      estado,
      fecha_actualizacion;
    `,
    [nuevoNombre, idUsuario],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - DESHABILITAR CUENTA
===================================================== */

async function deshabilitarUsuario(idUsuario) {
  const resultado = await pool.query(
    `
    UPDATE usuarios
    SET 
      estado = 'Inhabilitado',
      fecha_actualizacion = CURRENT_TIMESTAMP,
      fecha_reactivacion = NULL
    WHERE id_usuario = $1
    RETURNING 
      id_usuario,
      nombre,
      correo,
      estado;
    `,
    [idUsuario],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - SOLICITAR REACTIVACIÓN
===================================================== */

async function solicitarReactivacionUsuario(correo) {
  const resultado = await pool.query(
    `
    UPDATE usuarios
    SET 
      estado = 'Pendiente',
      fecha_actualizacion = CURRENT_TIMESTAMP,
      fecha_reactivacion = CURRENT_TIMESTAMP + INTERVAL '20 seconds'
    WHERE correo = $1
    RETURNING 
      id_usuario,
      nombre,
      correo,
      estado,
      fecha_reactivacion;
    `,
    [correo],
  );

  return resultado.rows[0];
}

/* =====================================================
   USUARIOS - ACTIVAR CUENTA SI YA PASÓ EL TIEMPO
===================================================== */

async function activarUsuarioSiYaPasoTiempo(correo) {
  const resultado = await pool.query(
    `
    UPDATE usuarios
    SET 
      estado = 'Activo',
      fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE correo = $1
      AND estado = 'Pendiente'
      AND fecha_reactivacion <= CURRENT_TIMESTAMP
    RETURNING 
      id_usuario,
      nombre,
      correo,
      estado;
    `,
    [correo],
  );

  return resultado.rows[0];
}

/* =====================================================
   PRODUCTOS - LEER 6 PRODUCTOS MÁS ECONÓMICOS
===================================================== */

async function obtenerProductosEconomicos() {
  const resultado = await pool.query(`
    SELECT 
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.imagen,
      p.disponible,
      p.stock,
      c.nombre AS categoria
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.disponible = true
      AND p.stock > 0
    ORDER BY p.precio ASC
    LIMIT 6;
  `);

  return resultado.rows;
}

/* =====================================================
   OFERTAS - LEER OFERTAS ACTIVAS
===================================================== */

async function obtenerOfertas() {
  const resultado = await pool.query(`
    SELECT
      o.id_oferta,
      o.id_producto,
      p.nombre,
      COALESCE(o.descripcion, p.descripcion) AS descripcion,
      p.precio,
      o.precio_oferta,
      p.imagen,
      p.stock,
      o.activa,
      o.fecha_inicio,
      o.fecha_fin
    FROM ofertas o
    INNER JOIN productos p ON o.id_producto = p.id_producto
    WHERE o.activa = true
      AND p.disponible = true
      AND (o.fecha_inicio IS NULL OR o.fecha_inicio <= CURRENT_DATE)
      AND (o.fecha_fin IS NULL OR o.fecha_fin >= CURRENT_DATE)
    ORDER BY o.id_oferta;
  `);

  return resultado.rows;
}

/* =====================================================
   PEDIDOS - LEER PEDIDOS DETALLADOS CON PRODUCTOS
===================================================== */

async function actualizarEstadosPedidosAutomaticos() {
  await pool.query(`
    UPDATE pedidos
    SET estado = CASE
      WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_pedido)) >= 90 THEN 'Entregado'
      WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_pedido)) >= 60 THEN 'Enviado'
      WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_pedido)) >= 30 THEN 'Preparando'
      ELSE 'Pendiente'
    END
    WHERE estado <> 'Cancelado';
  `);
}

async function listarPedidosDetallados(idUsuario = null) {
  await actualizarEstadosPedidosAutomaticos();

  const valores = [];
  let filtro = "";

  if (idUsuario) {
    filtro = "WHERE p.id_usuario = $1";
    valores.push(idUsuario);
  }

  const resultado = await pool.query(
    `
    SELECT
      p.id_pedido,
      p.id_usuario,
      p.cliente_nombre,
      p.cliente_correo,
      p.cliente_telefono,
      p.direccion,
      p.metodo_pago,
      p.total AS total_pedido,
      p.estado,
      p.fecha_pedido,

      d.id_detalle,
      d.id_producto,
      d.nombre_producto,
      d.cantidad,
      d.precio_unitario,
      d.subtotal,

      pr.imagen
    FROM pedidos p
    INNER JOIN detalle_pedido d
      ON p.id_pedido = d.id_pedido
    LEFT JOIN productos pr
      ON d.id_producto = pr.id_producto
    ${filtro}
    ORDER BY p.id_pedido DESC, d.id_detalle ASC;
    `,
    valores,
  );

  return resultado.rows;
}

/* =====================================================
   PEDIDOS - CANCELAR PEDIDO
===================================================== */

async function cancelarPedido(idPedido, idUsuario) {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    await actualizarEstadosPedidosAutomaticos();

    const pedidoResultado = await cliente.query(
      `
      SELECT 
        id_pedido,
        id_usuario,
        estado
      FROM pedidos
      WHERE id_pedido = $1
        AND id_usuario = $2
      FOR UPDATE;
      `,
      [idPedido, idUsuario],
    );

    if (pedidoResultado.rows.length === 0) {
      const error = new Error("Pedido no encontrado para este usuario.");
      error.statusCode = 404;
      throw error;
    }

    const pedido = pedidoResultado.rows[0];

    if (pedido.estado !== "Pendiente" && pedido.estado !== "Preparando") {
      const error = new Error(
        "Este pedido ya no se puede cancelar porque está en estado: " +
          pedido.estado,
      );
      error.statusCode = 400;
      throw error;
    }

    const detalleResultado = await cliente.query(
      `
      SELECT 
        id_producto,
        cantidad
      FROM detalle_pedido
      WHERE id_pedido = $1;
      `,
      [idPedido],
    );

    for (const detalle of detalleResultado.rows) {
      await cliente.query(
        `
        UPDATE productos
        SET stock = stock + $1
        WHERE id_producto = $2;
        `,
        [detalle.cantidad, detalle.id_producto],
      );
    }

    const pedidoCancelado = await cliente.query(
      `
      UPDATE pedidos
      SET estado = 'Cancelado'
      WHERE id_pedido = $1
        AND id_usuario = $2
      RETURNING 
        id_pedido,
        id_usuario,
        cliente_nombre,
        total,
        estado,
        fecha_pedido;
      `,
      [idPedido, idUsuario],
    );

    await cliente.query("COMMIT");

    return pedidoCancelado.rows[0];
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

/* =====================================================
   EXPORTAR FUNCIONES
===================================================== */

module.exports = {
  probarConexion,

  obtenerProductos,
  obtenerProductoPorId,
  obtenerProductosEconomicos,
  obtenerOfertas,

  buscarUsuarioPorCorreo,
  registrarUsuario,
  actualizarEstadoUsuario,
  actualizarNombreUsuario,
  deshabilitarUsuario,
  solicitarReactivacionUsuario,
  activarUsuarioSiYaPasoTiempo,

  guardarPedido,
  listarPedidos,
  listarPedidosDetallados,
  actualizarEstadosPedidosAutomaticos,
  cancelarPedido,
  obtenerPedidoPorId,
  obtenerDetallePedido,
  actualizarEstadoPedido,
};
