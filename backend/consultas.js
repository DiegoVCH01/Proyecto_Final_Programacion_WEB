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
      productos,
    } = datosPedido;

    let total = 0;

    productos.forEach(function (producto) {
      total += Number(producto.precio) * Number(producto.cantidad);
    });

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

    for (const producto of productos) {
      const precio = Number(producto.precio);
      const cantidad = Number(producto.cantidad);
      const subtotal = precio * cantidad;

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
          producto.id_producto || null,
          producto.nombre,
          cantidad,
          precio,
          subtotal,
        ],
      );
    }

    await cliente.query("COMMIT");

    return {
      id_pedido: idPedido,
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
   EXPORTAR FUNCIONES
===================================================== */

module.exports = {
  probarConexion,

  obtenerProductos,
  obtenerProductoPorId,
  obtenerProductosEconomicos,

  buscarUsuarioPorCorreo,
  registrarUsuario,
  actualizarEstadoUsuario,
  actualizarNombreUsuario,
  deshabilitarUsuario,
  solicitarReactivacionUsuario,
  activarUsuarioSiYaPasoTiempo,

  guardarPedido,
  listarPedidos,
  obtenerPedidoPorId,
  obtenerDetallePedido,
  actualizarEstadoPedido,
};
