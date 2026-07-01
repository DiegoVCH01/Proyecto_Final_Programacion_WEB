/* ==========================
   OFERTAS.HTML
========================== */

async function iniciarOfertas() {
  const ofertasGrid = document.getElementById("ofertasGrid");

  if (!ofertasGrid) {
    return;
  }

  await cargarOfertasDesdeBD();
}

async function cargarOfertasDesdeBD() {
  try {
    const respuesta = await fetch("http://localhost:4000/api/ofertas");

    const ofertas = await respuesta.json();

    const contenedor = document.getElementById("ofertasGrid");

    contenedor.innerHTML = "";

    ofertas.forEach(function (oferta) {
      const tarjeta = crearTarjetaOferta(oferta);

      contenedor.appendChild(tarjeta);
    });
    activarBotonesOfertas();
  } catch (error) {
    console.error("Error al cargar ofertas:", error);
  }
}

function crearTarjetaOferta(oferta) {
  const tarjeta = document.createElement("article");

  tarjeta.className = "oferta-card";

  tarjeta.dataset.idProducto = oferta.id_producto;
  tarjeta.dataset.precioNumero = oferta.precio_oferta;
  tarjeta.dataset.stock = oferta.stock;
  tarjeta.dataset.nombre = oferta.nombre;

  const stock = Number(oferta.stock);

  const textoBoton =
    stock > 0
      ? '<i class="fa-solid fa-cart-shopping"></i> Agregar'
      : '<i class="fa-solid fa-circle-xmark"></i> Agotado';

  tarjeta.innerHTML = `
  ${
    stock > 0 && stock <= 3
      ? '<span class="menu-badge">Últimas unidades</span>'
      : ""
  }
        <div class="oferta-info">

            <h3>${oferta.nombre}</h3>

            <p>${oferta.descripcion}</p>

            <div class="precio-box">

                <span class="precio-original">
                    S/ ${Number(oferta.precio).toFixed(2)}
                </span>

                <span class="precio-oferta">
                    S/ ${Number(oferta.precio_oferta).toFixed(2)}
                </span>

            </div>
            <span class="${stock > 0 ? "oferta-stock" : "oferta-stock agotado"}">
    ${stock > 0 ? "Stock disponible: " + stock : "Agotado"}
       </span>
<button
    class="btn-carrito"
    ${stock <= 0 ? "disabled" : ""}
>
    ${textoBoton}
</button>

        </div>

        <img src="${oferta.imagen}" alt="${oferta.nombre}">
    `;

  return tarjeta;
}

function activarBotonesOfertas() {
  const botones = document.querySelectorAll(".btn-carrito");

  botones.forEach(function (boton) {
    boton.addEventListener("click", async function () {
      const usuarioActivo = obtenerUsuarioActivoOfertas();

      if (!usuarioActivo) {
        const irLogin = await mostrarModalOfertas({
          icono: "🔒",
          titulo: "Inicia sesión",
          mensaje:
            "Para agregar ofertas al pedido primero debes iniciar sesión.",
          textoConfirmar: "Iniciar sesión",
          textoCancelar: "Seguir viendo",
        });

        if (irLogin) {
          window.location.href = "login.html";
        }

        return;
      }

      const tarjeta = boton.closest(".oferta-card");

      if (!tarjeta) {
        return;
      }

      const stock = Number(tarjeta.dataset.stock);

      if (stock <= 0) {
        mostrarModalOfertas({
          icono: "🚫",
          titulo: "Oferta agotada",
          mensaje: "Esta oferta no tiene stock disponible por el momento.",
          textoConfirmar: "Entendido",
        });

        return;
      }

      const idProducto = tarjeta.dataset.idProducto;
      const nombre = tarjeta.dataset.nombre;
      const cantidadEnPedido = obtenerCantidadOfertaEnPedido(
        idProducto,
        nombre,
      );
      const stockRestante = stock - cantidadEnPedido;

      if (stockRestante <= 0) {
        mostrarModalOfertas({
          icono: "⚠️",
          titulo: "Stock alcanzado",
          mensaje:
            "Ya agregaste al pedido todas las unidades disponibles de esta oferta.",
          textoConfirmar: "Entendido",
        });

        return;
      }

      abrirModalOferta(tarjeta);
    });
  });
}

function abrirModalOferta(tarjeta) {
  const nombre = tarjeta.dataset.nombre;
  const precioTexto = tarjeta.querySelector(".precio-oferta").textContent;
  const idProducto = tarjeta.dataset.idProducto;
  const precioNumero = Number(tarjeta.dataset.precioNumero);
  const stock = Number(tarjeta.dataset.stock);

  const cantidadEnPedido = obtenerCantidadOfertaEnPedido(idProducto, nombre);
  const stockRestante = stock - cantidadEnPedido;

  if (stockRestante <= 0) {
    mostrarModalOfertas({
      icono: "⚠️",
      titulo: "Stock alcanzado",
      mensaje:
        "Ya agregaste al pedido todas las unidades disponibles de esta oferta.",
      textoConfirmar: "Entendido",
    });

    return;
  }

  let cantidad = 1;

  const fondo = document.createElement("div");
  fondo.className = "modal-cantidad-fondo";

  const caja = document.createElement("div");
  caja.className = "modal-cantidad-caja";

  caja.innerHTML = `
    <h2>Confirmar oferta</h2>

    <p class="modal-cantidad-texto">
      ¿Deseas agregar esta oferta?
    </p>

    <h3 class="modal-cantidad-nombre">
      ${nombre}
    </h3>

    <p class="modal-cantidad-precio">
      Precio: ${precioTexto}
    </p>

    <p class="modal-cantidad-stock">
      Stock disponible: ${stock}
      ${cantidadEnPedido > 0 ? " | Ya en pedido: " + cantidadEnPedido : ""}
    </p>

    <div class="controles-cantidad">
      <button class="btn-cantidad btn-cantidad-restar" type="button">
        -
      </button>

      <span class="cantidad-seleccionada">
        1
      </span>

      <button class="btn-cantidad btn-cantidad-sumar" type="button">
        +
      </button>
    </div>

    <p class="modal-stock-mensaje"></p>

    <div class="modal-cantidad-acciones">
      <button class="btn-modal btn-confirmar-cantidad" type="button">
        Agregar
      </button>

      <button class="btn-modal btn-cancelar-cantidad" type="button">
        Cancelar
      </button>
    </div>
  `;

  fondo.appendChild(caja);
  document.body.appendChild(fondo);

  const textoCantidad = caja.querySelector(".cantidad-seleccionada");
  const mensaje = caja.querySelector(".modal-stock-mensaje");

  caja
    .querySelector(".btn-cantidad-sumar")
    .addEventListener("click", function () {
      if (cantidad < stockRestante) {
        cantidad++;
        textoCantidad.textContent = cantidad;
        mensaje.textContent = "";
      } else {
        mensaje.textContent = "No puedes superar el stock disponible.";
      }
    });

  caja
    .querySelector(".btn-cantidad-restar")
    .addEventListener("click", function () {
      if (cantidad > 1) {
        cantidad--;
        textoCantidad.textContent = cantidad;
        mensaje.textContent = "";
      }
    });

  caja
    .querySelector(".btn-confirmar-cantidad")
    .addEventListener("click", function () {
      const cantidadActual = agregarOfertaAlCarrito(
        nombre,
        precioNumero,
        cantidad,
        idProducto,
      );

      mostrarNotificacionOfertas(
        "✅ " +
          nombre +
          " agregado al pedido. Cantidad agregada: " +
          cantidad +
          ". Total actual: " +
          cantidadActual,
      );

      fondo.remove();
    });

  caja
    .querySelector(".btn-cancelar-cantidad")
    .addEventListener("click", function () {
      fondo.remove();
    });

  fondo.addEventListener("click", function (e) {
    if (e.target === fondo) {
      fondo.remove();
    }
  });
}

function agregarOfertaAlCarrito(nombre, precio, cantidad, idProducto) {
  let pedido = [];

  const pedidoGuardado = localStorage.getItem("pedidoMrsGreenSpoon");

  if (pedidoGuardado) {
    pedido = JSON.parse(pedidoGuardado);
  }

  let cantidadActual = cantidad;

  const ofertaExistente = pedido.find(function (producto) {
    return Number(producto.id_producto) === Number(idProducto);
  });

  if (ofertaExistente) {
    ofertaExistente.cantidad += cantidad;
    ofertaExistente.precio = Number(precio);
    ofertaExistente.precioTexto = "S/ " + Number(precio).toFixed(2);
    cantidadActual = ofertaExistente.cantidad;
  } else {
    pedido.push({
      id_producto: idProducto,
      nombre: nombre,
      precio: Number(precio),
      precioTexto: "S/ " + Number(precio).toFixed(2),
      cantidad: cantidad,
    });
  }

  localStorage.setItem("pedidoMrsGreenSpoon", JSON.stringify(pedido));

  console.log("Oferta agregada al pedido:");
  console.table(pedido);

  return cantidadActual;
}

function obtenerUsuarioActivoOfertas() {
  const nombreUsuario = localStorage.getItem("usuarioActivoMrsGreenSpoon");
  const idUsuario = localStorage.getItem("usuarioIdMrsGreenSpoon");
  const correoUsuario = localStorage.getItem("usuarioCorreoMrsGreenSpoon");

  if (!nombreUsuario) {
    return null;
  }

  return {
    id: idUsuario,
    nombre: nombreUsuario,
    correo: correoUsuario,
  };
}

function obtenerCantidadOfertaEnPedido(idProducto, nombre) {
  const pedidoGuardado = localStorage.getItem("pedidoMrsGreenSpoon");

  if (!pedidoGuardado) {
    return 0;
  }

  const pedido = JSON.parse(pedidoGuardado);

  const productoEncontrado = pedido.find(function (producto) {
    if (idProducto && producto.id_producto) {
      return Number(producto.id_producto) === Number(idProducto);
    }

    return producto.nombre === nombre;
  });

  if (!productoEncontrado) {
    return 0;
  }

  return Number(productoEncontrado.cantidad);
}

function mostrarModalOfertas(opciones) {
  if (window.mostrarModalSistema) {
    return window.mostrarModalSistema(opciones);
  }

  alert(opciones.mensaje);
  return Promise.resolve(false);
}

function mostrarNotificacionOfertas(mensaje) {
  const notificacionAnterior = document.getElementById("notificacionOfertaJs");

  if (notificacionAnterior) {
    notificacionAnterior.remove();
  }

  const notificacion = document.createElement("div");
  notificacion.id = "notificacionOfertaJs";
  notificacion.className = "notificacion-menu-js";
  notificacion.textContent = mensaje;

  document.body.appendChild(notificacion);

  setTimeout(function () {
    notificacion.remove();
  }, 4500);
}

document.addEventListener("DOMContentLoaded", function () {
  iniciarOfertas();
});
