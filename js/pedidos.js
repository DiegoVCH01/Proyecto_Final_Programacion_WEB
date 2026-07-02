document.addEventListener("DOMContentLoaded", function () {
  iniciarPaginaPedidos();
});

function iniciarPaginaPedidos() {
  const usuario = obtenerUsuarioPedidos();

  if (!usuario) {
    mostrarMensajePedidos(
      "Debes iniciar sesión para ver tus pedidos registrados.",
      true,
    );
    return;
  }

  cargarPedidosDesdeBD(usuario.id);

  setInterval(function () {
    cargarPedidosDesdeBD(usuario.id);
  }, 30000);
}

function obtenerUsuarioPedidos() {
  const idUsuario = localStorage.getItem("usuarioIdMrsGreenSpoon");
  const nombreUsuario = localStorage.getItem("usuarioActivoMrsGreenSpoon");
  const correoUsuario = localStorage.getItem("usuarioCorreoMrsGreenSpoon");

  if (!idUsuario || !nombreUsuario) {
    return null;
  }

  return {
    id: idUsuario,
    nombre: nombreUsuario,
    correo: correoUsuario,
  };
}

async function cargarPedidosDesdeBD(idUsuario) {
  const cuerpoTabla = document.getElementById("tablaPedidosBody");

  if (!cuerpoTabla) {
    return;
  }

  try {
    const respuesta = await fetch(
      "http://localhost:4000/api/pedidos/detallados?id_usuario=" + idUsuario,
    );

    const pedidos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensajePedidos("No se pudieron cargar los pedidos.");
      return;
    }

    if (pedidos.length === 0) {
      mostrarMensajePedidos("Todavía no tienes pedidos registrados.");
      return;
    }

    cuerpoTabla.innerHTML = "";

    const pedidosMostrados = new Set();

    pedidos.forEach(function (pedido) {
      const mostrarAccion = !pedidosMostrados.has(pedido.id_pedido);

      const fila = crearFilaPedido(pedido, mostrarAccion);
      cuerpoTabla.appendChild(fila);

      pedidosMostrados.add(pedido.id_pedido);
    });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    mostrarMensajePedidos("No se pudo conectar con el servidor.");
  }
}

function crearFilaPedido(pedido, mostrarAccion) {
  const fila = document.createElement("tr");

  const numeroPedido = String(pedido.id_pedido).padStart(3, "0");
  const imagen = pedido.imagen || "img/spoon.png";
  const estadoClase = obtenerClaseEstado(pedido.estado);
  const subtotal = Number(pedido.subtotal);

  let accionPedido = `<span class="texto-accion-pedido">No disponible</span>`;

  if (
    mostrarAccion &&
    (pedido.estado === "Pendiente" || pedido.estado === "Preparando")
  ) {
    accionPedido = `
      <button 
        type="button" 
        class="btn-cancelar-pedido" 
        data-id-pedido="${pedido.id_pedido}">
        Cancelar
      </button>
    `;
  } else if (!mostrarAccion) {
    accionPedido = "";
  }

  fila.innerHTML = `
    <td>${numeroPedido}</td>

    <td>
      <img
        src="${imagen}"
        alt="${pedido.nombre_producto}"
        class="tabla-img"
      >
    </td>

    <td>
      <i class="fa-solid fa-user"></i>
      ${pedido.cliente_nombre || "Cliente"}
    </td>

    <td>${pedido.nombre_producto}</td>

    <td>${pedido.cantidad}</td>

    <td>S/ ${subtotal.toFixed(2)}</td>

    <td>
      <span class="estado ${estadoClase}">
        ${pedido.estado}
      </span>
    </td>

    <td>
      ${accionPedido}
    </td>
  `;

  const botonCancelar = fila.querySelector(".btn-cancelar-pedido");

  if (botonCancelar) {
    botonCancelar.addEventListener("click", function () {
      cancelarPedidoDesdePagina(pedido.id_pedido);
    });
  }

  return fila;
}

async function cancelarPedidoDesdePagina(idPedido) {
  const usuario = obtenerUsuarioPedidos();

  if (!usuario) {
    mostrarMensajePedidos("Debes iniciar sesión para cancelar un pedido.", true);
    return;
  }

  const confirmar = await mostrarModalPedido({
    icono: "⚠️",
    titulo: "Cancelar pedido",
    mensaje:
      "¿Estás seguro de cancelar este pedido? Solo se permite cancelar si está pendiente o en preparación.",
    textoConfirmar: "Sí, cancelar",
    textoCancelar: "No cancelar",
  });

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(
      "http://localhost:4000/api/pedidos/" + idPedido + "/cancelar",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: usuario.id,
        }),
      },
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarModalPedido({
        icono: "❌",
        titulo: "No se pudo cancelar",
        mensaje: datos.mensaje,
        textoConfirmar: "Entendido",
      });

      return;
    }

    await mostrarModalPedido({
      icono: "✅",
      titulo: "Pedido cancelado",
      mensaje:
        "El pedido fue cancelado correctamente y el stock fue devuelto.",
      textoConfirmar: "Aceptar",
    });

    cargarPedidosDesdeBD(usuario.id);
  } catch (error) {
    console.error("Error al cancelar pedido:", error);

    mostrarModalPedido({
      icono: "🔌",
      titulo: "Error de conexión",
      mensaje: "No se pudo conectar con el servidor.",
      textoConfirmar: "Entendido",
    });
  }
}

function mostrarModalPedido(opciones) {
  if (window.mostrarModalSistema) {
    return window.mostrarModalSistema(opciones);
  }

  const confirmar = confirm(opciones.mensaje);
  return Promise.resolve(confirmar);
}

function obtenerClaseEstado(estado) {
  const estadoNormalizado = estado.toLowerCase();

  if (estadoNormalizado === "pendiente") {
    return "pendiente";
  }

  if (estadoNormalizado === "preparando") {
    return "preparando";
  }

  if (estadoNormalizado === "enviado") {
    return "enviado";
  }

  if (estadoNormalizado === "entregado") {
    return "entregado";
  }

  if (estadoNormalizado === "cancelado") {
    return "cancelado";
  }

  return "en-proceso";
}

function mostrarMensajePedidos(mensaje, mostrarBotonLogin = false) {
  const cuerpoTabla = document.getElementById("tablaPedidosBody");

  if (!cuerpoTabla) {
    return;
  }

  cuerpoTabla.innerHTML = `
    <tr>
      <td colspan="8" class="pedidos-mensaje-tabla">
        <p>${mensaje}</p>

        ${
          mostrarBotonLogin
            ? `<a href="login.html" class="btn-ver-ofertas">
                <i class="fa-solid fa-right-to-bracket"></i>
                Iniciar sesión
              </a>`
            : ""
        }
      </td>
    </tr>
  `;
}
