const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const consultas = require("./consultas");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/* ==========================
   RUTA PRINCIPAL
========================== */

app.get("/", function (req, res) {
  res.send("Servidor de Mrs. Green Spoon funcionando correctamente.");
});

/* ==========================
   PROBAR CONEXIÓN
========================== */

app.get("/api/test", async function (req, res) {
  try {
    const resultado = await consultas.probarConexion();

    res.json({
      mensaje: "Conexión exitosa con PostgreSQL",
      fecha: resultado.fecha_actual,
    });
  } catch (error) {
    console.error("Error de conexión:", error);

    res.status(500).json({
      mensaje: "Error al conectar con la base de datos",
    });
  }
});

/* ==========================
   PRODUCTOS
========================== */

app.get("/api/productos", async function (req, res) {
  try {
    const productos = await consultas.obtenerProductos();

    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);

    res.status(500).json({
      mensaje: "Error al obtener productos",
    });
  }
});

/* ==========================
   PRODUCTOS MÁS ECONÓMICOS
========================== */

app.get("/api/productos/economicos", async function (req, res) {
  try {
    const productos = await consultas.obtenerProductosEconomicos();

    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos económicos:", error);

    res.status(500).json({
      mensaje: "Error al obtener productos económicos",
    });
  }
});

/* ==========================
   REGISTRAR USUARIO
========================== */

app.post("/api/usuarios/registrar", async function (req, res) {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener mínimo 8 caracteres",
      });
    }

    const usuarioExistente = await consultas.buscarUsuarioPorCorreo(correo);

    if (usuarioExistente) {
      return res.status(400).json({
        mensaje: "El correo ya está registrado",
      });
    }

    const passwordEncriptado = await bcrypt.hash(password, 10);

    const nuevoUsuario = await consultas.registrarUsuario(
      nombre,
      correo,
      passwordEncriptado,
    );

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);

    res.status(500).json({
      mensaje: "Error al registrar usuario",
    });
  }
});

/* ==========================
   LOGIN USUARIO
========================== */

app.post("/api/usuarios/login", async function (req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: "Correo y contraseña son obligatorios",
      });
    }

    const usuario = await consultas.buscarUsuarioPorCorreo(correo);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    if (usuario.estado === "Inhabilitado") {
      return res.status(403).json({
        mensaje:
          "La cuenta está inhabilitada. ¿Deseas solicitar la reactivación?",
        cuentaInhabilitada: true,
      });
    }

    if (usuario.estado === "Pendiente") {
      return res.status(403).json({
        mensaje:
          "La cuenta está en proceso de reactivación. Intenta nuevamente en unos segundos.",
        reactivacionPendiente: true,
      });
    }

    res.json({
      mensaje: "Inicio de sesión correcto",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        estado: usuario.estado,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    res.status(500).json({
      mensaje: "Error al iniciar sesión",
    });
  }
});

app.put("/api/usuarios/:id/nombre", async function (req, res) {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({
        mensaje: "El nombre no puede estar vacío",
      });
    }

    const usuarioActualizado = await consultas.actualizarNombreUsuario(
      id,
      nombre.trim(),
    );

    if (!usuarioActualizado) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    res.json({
      mensaje: "Nombre actualizado correctamente",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar nombre:", error);

    res.status(500).json({
      mensaje: "Error al actualizar nombre",
    });
  }
});

app.patch("/api/usuarios/:id/deshabilitar", async function (req, res) {
  try {
    const { id } = req.params;

    const usuarioDeshabilitado = await consultas.deshabilitarUsuario(id);

    if (!usuarioDeshabilitado) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    res.json({
      mensaje: "Cuenta deshabilitada correctamente",
      usuario: usuarioDeshabilitado,
    });
  } catch (error) {
    console.error("Error al deshabilitar usuario:", error);

    res.status(500).json({
      mensaje: "Error al deshabilitar usuario",
    });
  }
});

app.post("/api/usuarios/solicitar-reactivacion", async function (req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: "Correo y contraseña son obligatorios",
      });
    }

    const usuario = await consultas.buscarUsuarioPorCorreo(correo);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos",
      });
    }

    if (usuario.estado === "Activo") {
      return res.status(400).json({
        mensaje: "La cuenta ya está activa",
      });
    }

    const usuarioPendiente =
      await consultas.solicitarReactivacionUsuario(correo);

    res.json({
      mensaje:
        "Solicitud de reactivación enviada. Intenta iniciar sesión nuevamente en unos segundos.",
      segundos: 20,
      usuario: usuarioPendiente,
    });
  } catch (error) {
    console.error("Error al solicitar reactivación:", error);

    res.status(500).json({
      mensaje: "Error al solicitar reactivación",
    });
  }
});

app.post("/api/usuarios/completar-reactivacion", async function (req, res) {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        mensaje: "El correo es obligatorio",
      });
    }

    const usuarioActivado =
      await consultas.activarUsuarioSiYaPasoTiempo(correo);

    if (!usuarioActivado) {
      return res.status(400).json({
        mensaje: "La cuenta todavía está en proceso de reactivación",
      });
    }

    res.json({
      mensaje: "Cuenta reactivada correctamente",
      usuario: usuarioActivado,
    });
  } catch (error) {
    console.error("Error al completar reactivación:", error);

    res.status(500).json({
      mensaje: "Error al completar reactivación",
    });
  }
});

/* ==========================
   REGISTRAR PEDIDO
========================== */

app.post("/api/pedidos", async function (req, res) {
  try {
    const {
      id_usuario,
      cliente_nombre,
      cliente_correo,
      cliente_telefono,
      direccion,
      metodo_pago,
      descuento,
      productos,
    } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        mensaje: "El pedido no tiene productos",
      });
    }

    const pedidoGuardado = await consultas.guardarPedido({
      id_usuario,
      cliente_nombre,
      cliente_correo,
      cliente_telefono,
      direccion,
      metodo_pago,
      descuento,
      productos,
    });

    res.status(201).json({
      mensaje: "Pedido registrado correctamente",
      pedido: pedidoGuardado,
    });
  } catch (error) {
    console.error("Error al registrar pedido:", error);

    res.status(error.statusCode || 500).json({
      mensaje: error.message || "Error al registrar pedido",
    });
  }
});

/* ==========================
   LISTAR PEDIDOS
========================== */

app.get("/api/pedidos", async function (req, res) {
  try {
    const pedidos = await consultas.listarPedidos();

    res.json(pedidos);
  } catch (error) {
    console.error("Error al listar pedidos:", error);

    res.status(500).json({
      mensaje: "Error al listar pedidos",
    });
  }
});


/* ==========================
   LISTAR PEDIDOS DETALLADOS
========================== */

app.get("/api/pedidos/detallados", async function (req, res) {
  try {
    const { id_usuario } = req.query;

    const pedidos = await consultas.listarPedidosDetallados(id_usuario || null);

    res.json(pedidos);
  } catch (error) {
    console.error("Error al listar pedidos detallados:", error);

    res.status(500).json({
      mensaje: "Error al listar pedidos detallados",
    });
  }
});

/* ==========================
   CANCELAR PEDIDO
========================== */

app.patch("/api/pedidos/:id/cancelar", async function (req, res) {
  try {
    const { id } = req.params;
    const { id_usuario } = req.body;

    if (!id_usuario) {
      return res.status(400).json({
        mensaje: "El usuario es obligatorio para cancelar el pedido",
      });
    }

    const pedidoCancelado = await consultas.cancelarPedido(id, id_usuario);

    res.json({
      mensaje: "Pedido cancelado correctamente",
      pedido: pedidoCancelado,
    });
  } catch (error) {
    console.error("Error al cancelar pedido:", error);

    res.status(error.statusCode || 500).json({
      mensaje: error.message || "Error al cancelar pedido",
    });
  }
});

/* ==========================
   DETALLE DE UN PEDIDO
========================== */

app.get("/api/pedidos/:id/detalle", async function (req, res) {
  try {
    const { id } = req.params;

    const detalle = await consultas.obtenerDetallePedido(id);

    res.json(detalle);
  } catch (error) {
    console.error("Error al obtener detalle del pedido:", error);

    res.status(500).json({
      mensaje: "Error al obtener detalle del pedido",
    });
  }
});

/* ==========================
   OFERTAS
========================== */

app.get("/api/ofertas", async function (req, res) {
  try {
    const ofertas = await consultas.obtenerOfertas();

    res.json(ofertas);
  } catch (error) {
    console.error("Error al obtener ofertas:", error);

    res.status(500).json({
      mensaje: "Error al obtener ofertas",
    });
  }
});

/* ==========================
   INICIAR SERVIDOR
========================== */

app.listen(PORT, function () {
  console.log("Servidor ejecutándose en http://localhost:" + PORT);
});
