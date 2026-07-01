document.addEventListener("DOMContentLoaded", function () {
  iniciarFormularioPedido();
});

let descuentoPedido = 0;

function iniciarFormularioPedido() {
  const form = document.getElementById("formPedido");

  if (!form) {
    return;
  }

  completarDatosUsuario();
  cargarResumenCarrito();

  const btnCupon = document.getElementById("btnValidarCupon");

  if (btnCupon) {
    btnCupon.addEventListener("click", validarCuponPedido);
  }

  form.addEventListener("submit", enviarPedidoABaseDatos);
}

function obtenerUsuarioFormulario() {
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

function obtenerCarritoPedido() {
  const carritoGuardado = localStorage.getItem("pedidoMrsGreenSpoon");

  if (!carritoGuardado) {
    return [];
  }

  return JSON.parse(carritoGuardado);
}

function guardarCarritoPedido(carrito) {
  localStorage.setItem("pedidoMrsGreenSpoon", JSON.stringify(carrito));
}

function completarDatosUsuario() {
  const usuario = obtenerUsuarioFormulario();

  if (!usuario) {
    return;
  }

  const inputNombres = document.querySelector("input[name='nombres']");
  const inputApellidos = document.querySelector("input[name='apellidos']");
  const inputCorreo = document.querySelector("input[name='correo']");
  const inputTelefono = document.querySelector("input[name='telefono']");
  const inputDireccion = document.querySelector("input[name='direccion']");
  const linkSesion = document.querySelector(".fp-link-sesion");
  const mensajeDatos = document.getElementById("mensajeDatosGuardados");

  const datosGuardados = obtenerDatosGuardadosPedido();

  if (inputNombres && !inputNombres.value) {
    inputNombres.value = datosGuardados?.nombres || usuario.nombre;
  }

  if (inputApellidos && datosGuardados?.apellidos) {
    inputApellidos.value = datosGuardados.apellidos;
  }

  if (inputCorreo) {
    inputCorreo.value = datosGuardados?.correo || usuario.correo || "";
  }

  if (inputTelefono && datosGuardados?.telefono) {
    inputTelefono.value = datosGuardados.telefono;
  }

  if (inputDireccion && datosGuardados?.direccion) {
    inputDireccion.value = datosGuardados.direccion;
  }

  if (linkSesion) {
    linkSesion.textContent = "Sesión activa";
    linkSesion.href = "#";
  }

  if (mensajeDatos && datosGuardados) {
    mensajeDatos.textContent =
      "Se cargaron los datos usados en tu último pedido. Puedes modificarlos si deseas.";
  }

  activarBotonNuevaDireccion();
}

function obtenerClaveDatosPedido() {
  const usuario = obtenerUsuarioFormulario();

  if (!usuario) {
    return null;
  }

  return "datosPedidoMrsGreenSpoon_" + usuario.id;
}

function obtenerDatosGuardadosPedido() {
  const clave = obtenerClaveDatosPedido();

  if (!clave) {
    return null;
  }

  const datosGuardados = localStorage.getItem(clave);

  if (!datosGuardados) {
    return null;
  }

  return JSON.parse(datosGuardados);
}

function guardarDatosPedidoUsuario(datos) {
  const clave = obtenerClaveDatosPedido();

  if (!clave) {
    return;
  }

  localStorage.setItem(clave, JSON.stringify(datos));
}

function activarBotonNuevaDireccion() {
  const botonNuevaDireccion = document.getElementById("btnNuevaDireccion");
  const inputDireccion = document.querySelector("input[name='direccion']");
  const mensajeDatos = document.getElementById("mensajeDatosGuardados");

  if (!botonNuevaDireccion || !inputDireccion) {
    return;
  }

  botonNuevaDireccion.addEventListener("click", function () {
    inputDireccion.value = "";
    inputDireccion.focus();

    if (mensajeDatos) {
      mensajeDatos.textContent =
        "Puedes ingresar una nueva dirección para este pedido.";
    }
  });
}

function cargarResumenCarrito() {
  const carrito = obtenerCarritoPedido();
  const listaCarrito = document.getElementById("fpListaCarrito");
  const badgeResumen = document.getElementById("fpBadgeResumen");

  if (!listaCarrito || !badgeResumen) {
    return;
  }

  if (carrito.length === 0) {
    listaCarrito.innerHTML = `
      <div class="fp-carrito-vacio">
        <p>Tu carrito está vacío.</p>
        <small>Agrega productos desde el menú u ofertas.</small>
      </div>
    `;

    badgeResumen.textContent = "Vacío";
    badgeResumen.className = "fp-badge fp-badge-vacio";

    actualizarTotalesCarrito();
    return;
  }

  let cantidadTotal = 0;

  listaCarrito.innerHTML = "";

  carrito.forEach(function (producto, indice) {
    cantidadTotal += Number(producto.cantidad);

    const precio = Number(producto.precio);
    const cantidad = Number(producto.cantidad);
    const subtotal = precio * cantidad;

    const item = document.createElement("div");
    item.className = "fp-item-carrito";

    item.innerHTML = `
      <div class="fp-item-info">
        <strong>${producto.nombre}</strong>
        <p>
          <span class="fp-cantidad">Cantidad: ${cantidad}</span>
          <span>${formatearPrecio(precio)} c/u</span>
        </p>
      </div>

      <div class="fp-item-lado">
        <span class="fp-item-precio">${formatearPrecio(subtotal)}</span>

        <button type="button" class="fp-btn-quitar" data-indice="${indice}">
          Quitar
        </button>
      </div>
    `;

    listaCarrito.appendChild(item);
  });

  badgeResumen.textContent = cantidadTotal + " producto(s)";
  badgeResumen.className = "fp-badge fp-badge-activo";

  activarBotonesQuitarProducto();
  actualizarTotalesCarrito();
}

function activarBotonesQuitarProducto() {
  const botones = document.querySelectorAll(".fp-btn-quitar");

  botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
      const indice = Number(boton.dataset.indice);
      const carrito = obtenerCarritoPedido();

      carrito.splice(indice, 1);
      guardarCarritoPedido(carrito);

      cargarResumenCarrito();
    });
  });
}

function calcularSubtotalCarrito() {
  const carrito = obtenerCarritoPedido();

  return carrito.reduce(function (total, producto) {
    return total + Number(producto.precio) * Number(producto.cantidad);
  }, 0);
}

function actualizarTotalesCarrito() {
  const subtotal = calcularSubtotalCarrito();
  const montoDescuento = subtotal * descuentoPedido;
  const total = subtotal - montoDescuento;

  const subtotalTexto = document.getElementById("fpSubtotalCarrito");
  const descuentoTexto = document.getElementById("fpDescuentoCarrito");
  const totalTexto = document.getElementById("fpTotalCarrito");

  if (subtotalTexto) {
    subtotalTexto.textContent = formatearPrecio(subtotal);
  }

  if (descuentoTexto) {
    descuentoTexto.textContent = "- " + formatearPrecio(montoDescuento);
  }

  if (totalTexto) {
    totalTexto.textContent = formatearPrecio(total);
  }
}

function validarCuponPedido() {
  const inputCupon = document.querySelector(".fp-cupon-flex input");
  const codigo = inputCupon.value.trim().toUpperCase();

  if (codigo === "") {
    mostrarModalFormulario({
      icono: "🎟️",
      titulo: "Cupón vacío",
      mensaje: "Ingresa un código de cupón para validarlo.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  if (codigo === "ECO20") {
    descuentoPedido = 0.2;

    mostrarModalFormulario({
      icono: "✅",
      titulo: "Cupón aplicado",
      mensaje: "Se aplicó un 20% de descuento a tu pedido.",
      textoConfirmar: "Aceptar",
    });

    actualizarTotalesCarrito();
    return;
  }

  descuentoPedido = 0;

  mostrarModalFormulario({
    icono: "❌",
    titulo: "Cupón no válido",
    mensaje: "El código ingresado no corresponde a un cupón disponible.",
    textoConfirmar: "Entendido",
  });

  actualizarTotalesCarrito();
}

async function enviarPedidoABaseDatos(evento) {
  evento.preventDefault();

  const form = document.getElementById("formPedido");
  const usuario = obtenerUsuarioFormulario();
  const carrito = obtenerCarritoPedido();

  if (!usuario) {
    const irLogin = await mostrarModalFormulario({
      icono: "🔒",
      titulo: "Inicia sesión",
      mensaje: "Para confirmar tu pedido primero debes iniciar sesión.",
      textoConfirmar: "Iniciar sesión",
      textoCancelar: "Cancelar",
    });

    if (irLogin) {
      window.location.href = "login.html";
    }

    return;
  }

  if (carrito.length === 0) {
    mostrarModalFormulario({
      icono: "🛒",
      titulo: "Carrito vacío",
      mensaje: "Agrega productos desde el menú u ofertas antes de confirmar.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  const terminos = document.getElementById("aceptarTerminos");

  if (!terminos || !terminos.checked) {
    mostrarModalFormulario({
      icono: "📄",
      titulo: "Acepta los términos",
      mensaje:
        "Para confirmar el pedido debes aceptar los Términos y Condiciones.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  const formData = new FormData(form);

  const nombres = formData.get("nombres").trim();
  const apellidos = formData.get("apellidos").trim();
  const correo = formData.get("correo").trim();
  const telefono = formData.get("telefono").trim();
  const direccion = formData.get("direccion").trim();
  const metodoPago = formData.get("metodo_pago");

  if (
    !validarNombreFormulario(nombres) ||
    !validarNombreFormulario(apellidos)
  ) {
    mostrarModalFormulario({
      icono: "⚠️",
      titulo: "Nombre no válido",
      mensaje: "Ingresa nombres y apellidos válidos, sin números.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  if (!validarCorreoFormulario(correo)) {
    mostrarModalFormulario({
      icono: "📧",
      titulo: "Correo no válido",
      mensaje: "Ingresa un correo electrónico válido.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  if (!validarTelefonoFormulario(telefono)) {
    mostrarModalFormulario({
      icono: "📱",
      titulo: "Teléfono no válido",
      mensaje: "Ingresa un número de teléfono válido.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  if (direccion.length < 8) {
    mostrarModalFormulario({
      icono: "📍",
      titulo: "Dirección incompleta",
      mensaje: "Ingresa una dirección más detallada para la entrega.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  if (!metodoPago) {
    mostrarModalFormulario({
      icono: "💳",
      titulo: "Método de pago requerido",
      mensaje: "Selecciona un método de pago para continuar.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  const confirmarPedido = await mostrarModalFormulario({
    icono: "🧾",
    titulo: "Confirmar pedido",
    mensaje:
      "¿Estás seguro de confirmar este pedido? Después de aceptar se registrará en el sistema.",
    textoConfirmar: "Sí, confirmar",
    textoCancelar: "Revisar pedido",
  });

  if (!confirmarPedido) {
    return;
  }

  if (metodoPago === "online" || metodoPago === "yape") {
    await simularPagoPedido(metodoPago);
  }

  const productosPedido = carrito.map(function (producto) {
    return {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: Number(producto.cantidad),
    };
  });

  try {
    const respuesta = await fetch("http://localhost:4000/api/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_usuario: usuario.id,
        cliente_nombre: nombres + " " + apellidos,
        cliente_correo: correo,
        cliente_telefono: telefono,
        direccion: direccion,
        metodo_pago: metodoPago,
        descuento: descuentoPedido,
        productos: productosPedido,
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mostrarModalFormulario({
        icono: "❌",
        titulo: "No se pudo registrar",
        mensaje: datos.mensaje,
        textoConfirmar: "Entendido",
      });

      return;
    }

    const guardarDatos = document.getElementById("guardarDatosPedido");

    if (!guardarDatos || guardarDatos.checked) {
      guardarDatosPedidoUsuario({
        nombres: nombres,
        apellidos: apellidos,
        correo: correo,
        telefono: telefono,
        direccion: direccion,
      });
    }

    localStorage.removeItem("pedidoMrsGreenSpoon");

    await mostrarModalFormulario({
      icono: "✅",
      titulo: "Pedido confirmado",
      mensaje:
        "Tu pedido fue registrado correctamente. Código de pedido: " +
        datos.pedido.id_pedido,
      textoConfirmar: "Ver mis pedidos",
    });

    window.location.href = "pedidos.html";
  } catch (error) {
    console.error("Error al registrar pedido:", error);

    mostrarModalFormulario({
      icono: "🔌",
      titulo: "Error de conexión",
      mensaje: "No se pudo conectar con el servidor.",
      textoConfirmar: "Entendido",
    });
  }
}

function simularPagoPedido(metodoPago) {
  return new Promise(function (resolve) {
    const modalAnterior = document.getElementById("modalPagoSimulado");

    if (modalAnterior) {
      modalAnterior.remove();
    }

    const fondo = document.createElement("div");
    fondo.id = "modalPagoSimulado";
    fondo.className = "modal-sistema-fondo";

    const caja = document.createElement("div");
    caja.className = "modal-sistema-caja";

    const nombreMetodo =
      metodoPago === "online" ? "pago en línea" : "Yape / Plin";

    let segundos = 10;

    caja.innerHTML = `
      <div class="modal-sistema-icono">💳</div>

      <h2>Procesando pago</h2>

      <p id="mensajePagoSimulado">
        Estamos validando tu ${nombreMetodo}. Espera ${segundos} segundos...
      </p>

      <div class="barra-pago-simulado">
        <div id="progresoPagoSimulado"></div>
      </div>
    `;

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    const mensaje = document.getElementById("mensajePagoSimulado");
    const progreso = document.getElementById("progresoPagoSimulado");

    const intervalo = setInterval(function () {
      segundos = segundos - 1;

      const porcentaje = ((10 - segundos) / 10) * 100;
      progreso.style.width = porcentaje + "%";

      if (segundos > 0) {
        mensaje.textContent =
          "Estamos validando tu " +
          nombreMetodo +
          ". Espera " +
          segundos +
          " segundos...";
      } else {
        clearInterval(intervalo);

        mensaje.textContent = "Pago confirmado correctamente.";
        progreso.style.width = "100%";

        setTimeout(function () {
          fondo.remove();
          resolve(true);
        }, 800);
      }
    }, 1000);
  });
}

function validarNombreFormulario(valor) {
  const patronNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  return valor.length >= 2 && patronNombre.test(valor);
}

function validarCorreoFormulario(correo) {
  const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return patronCorreo.test(correo);
}

function validarTelefonoFormulario(telefono) {
  const patronTelefono = /^9[0-9]{8}$/;
  return patronTelefono.test(telefono);
}

function formatearPrecio(valor) {
  return "S/ " + Number(valor).toFixed(2);
}

function mostrarModalFormulario(opciones) {
  if (window.mostrarModalSistema) {
    return window.mostrarModalSistema(opciones);
  }

  alert(opciones.mensaje);
  return Promise.resolve(true);
}
