(function () {
  "use strict";

  /* ==========================
     VARIABLES GENERALES
  ========================== */

  let carruselPausadoPorMouse = false;
  let carruselPausadoPorModal = false;
  const velocidadCarrusel = 0.35;

  document.addEventListener("DOMContentLoaded", function () {
    iniciarFuncionesGenerales();
    iniciarIndex();
    iniciarMenu();
  });

  /* ==========================
     FUNCIONES GENERALES
  ========================== */

  function iniciarFuncionesGenerales() {
    guardarUsuarioLogin();
    actualizarVistaUsuario();
  }

  function guardarUsuarioLogin() {
    const formularioLogin = document.querySelector(".form-auth");
    const inputUsuario = document.getElementById("usuario");

    if (!formularioLogin || !inputUsuario) {
      return;
    }

    formularioLogin.addEventListener("submit", function () {
      let usuario = inputUsuario.value.trim();

      if (usuario !== "") {
        if (usuario.includes("@")) {
          usuario = usuario.split("@")[0];
        }

        localStorage.setItem("usuarioActivoMrsGreenSpoon", usuario);
      }
    });
  }

  function actualizarVistaUsuario() {
    const usuarioActivo = localStorage.getItem("usuarioActivoMrsGreenSpoon");

    if (!usuarioActivo) {
      return;
    }

    cambiarMenuLogin(usuarioActivo);
    cambiarTituloBienvenida(usuarioActivo);
  }

  function cambiarMenuLogin(usuario) {
    const enlaces = document.querySelectorAll("nav a");

    enlaces.forEach(function (enlace) {
      if (enlace.textContent.trim() === "Login") {
        enlace.textContent = "👤 " + usuario;
        enlace.href = "#";

        enlace.addEventListener("click", function () {
          const cerrar = confirm("¿Deseas cerrar sesión?");

          if (cerrar === true) {
            localStorage.removeItem("usuarioActivoMrsGreenSpoon");
            window.location.href = "login.html";
          }
        });
      }
    });
  }

  function cambiarTituloBienvenida(usuario) {
    const tituloBienvenida = document.querySelector(".seccion-bienvenida h2");

    if (!tituloBienvenida) {
      return;
    }

    tituloBienvenida.textContent =
      "Bienvenido " + usuario + " a Mrs. Green Spoon";
  }

  function agregarAlPedido(nombre, precio, cantidad = 1) {
    const pedidoGuardado = localStorage.getItem("pedidoMrsGreenSpoon");
    let pedido = [];
    let cantidadActual = cantidad;

    if (pedidoGuardado) {
      pedido = JSON.parse(pedidoGuardado);
    }

    const productoExistente = pedido.find(function (producto) {
      return producto.nombre === nombre;
    });

    if (productoExistente) {
      productoExistente.cantidad = productoExistente.cantidad + cantidad;
      cantidadActual = productoExistente.cantidad;
    } else {
      pedido.push({
        nombre: nombre,
        precio: precio,
        cantidad: cantidad,
      });
    }

    localStorage.setItem("pedidoMrsGreenSpoon", JSON.stringify(pedido));

    const mensaje = document.getElementById("mensajePedido");

    if (mensaje) {
      mensaje.textContent =
        "Producto agregado al pedido correctamente. Cantidad actual: " +
        cantidadActual;
      mensaje.classList.add("exito");
    }

    console.log("Producto agregado al pedido:");
    console.log("Nombre:", nombre);
    console.log("Precio:", precio);
    console.log("Cantidad agregada:", cantidad);
    console.log("Cantidad actual:", cantidadActual);

    console.log("Pedido completo actualizado:");
    console.table(pedido);

    return cantidadActual;
  }

  /* ==========================
     INDEX.HTML
  ========================== */

  function iniciarIndex() {
    const carrusel = document.querySelector(".carrusel-ofertas");

    if (!carrusel) {
      return;
    }

    cargarCarruselIndex();
  }

  function cargarCarruselIndex() {
    const carrusel = document.querySelector(".carrusel-ofertas");

    if (!carrusel) {
      return;
    }

    const platillosMenu = [
      {
        nombre: "Bowl Renacer Verde",
        descripcion: "Arroz integral con vegetales asados y salsa de hierbas.",
        precio: "S/ 15.00",
        imagen: "img/bowl.jpg",
      },
      {
        nombre: "Ensalada Bosque Urbano",
        descripcion: "Mezcla fresca de verduras, queso y aderezo natural.",
        precio: "S/ 13.00",
        imagen: "img/ensalada.jpg",
      },
      {
        nombre: "Wrap Circular",
        descripcion: "Tortilla artesanal rellena con vegetales y pollo.",
        precio: "S/ 14.00",
        imagen: "img/wrap.jpg",
      },
      {
        nombre: "Pizza Huella Cero",
        descripcion:
          "Pizza artesanal con vegetales rostizados y queso fundido.",
        precio: "S/ 10.00",
        imagen: "img/pizza.jpg",
      },
      {
        nombre: "Hamburguesa Raíz Urbana",
        descripcion: "Hamburguesa de lentejas con vegetales frescos.",
        precio: "S/ 12.00",
        imagen: "img/hamburguesa.jpg",
      },
      {
        nombre: "Pasta EcoFresh",
        descripcion: "Pasta cremosa preparada con ingredientes reutilizados.",
        precio: "S/ 16.00",
        imagen: "img/pasta.jpg",
      },
      {
        nombre: "Papas Crocantes",
        descripcion: "Papas horneadas acompañadas de salsa casera.",
        precio: "S/ 8.00",
        imagen: "img/papas.jpg",
      },
      {
        nombre: "Nuggets Verdes",
        descripcion: "Nuggets artesanales preparados con vegetales mixtos.",
        precio: "S/ 9.00",
        imagen: "img/nuggets.jpg",
      },
      {
        nombre: "Tacos Naturales",
        descripcion: "Tacos rellenos con vegetales frescos y pollo.",
        precio: "S/ 11.00",
        imagen: "img/tacos.jpg",
      },
      {
        nombre: "Jugo Natural Fresh",
        descripcion: "Bebida preparada con frutas frescas de temporada.",
        precio: "S/ 6.00",
        imagen: "img/jugo.jpg",
      },
      {
        nombre: "Limonada Verde",
        descripcion: "Refrescante limonada artesanal con hierbabuena.",
        precio: "S/ 5.00",
        imagen: "img/limonada.jpg",
      },
      {
        nombre: "Batido Tropical",
        descripcion: "Batido natural de mango, plátano y avena.",
        precio: "S/ 7.00",
        imagen: "img/batido.jpg",
      },
    ];

    const platillosElegidos = mezclarPlatillos(platillosMenu).slice(0, 6);

    carrusel.innerHTML = "";
    carrusel.style.animation = "none";
    carrusel.style.transition = "none";
    carrusel.style.transform = "translateX(0)";

    platillosElegidos.forEach(function (platillo) {
      const tarjeta = crearTarjetaCarrusel(platillo);
      carrusel.appendChild(tarjeta);
    });

    platillosElegidos.forEach(function (platillo) {
      const tarjetaDuplicada = crearTarjetaCarrusel(platillo);
      carrusel.appendChild(tarjetaDuplicada);
    });

    moverCarruselConJS(carrusel);
  }

  function crearTarjetaCarrusel(platillo) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "destacada-card";

    tarjeta.innerHTML =
      '<img src="' +
      platillo.imagen +
      '" alt="' +
      platillo.nombre +
      '">' +
      "<h4>" +
      platillo.nombre +
      "</h4>" +
      "<p>" +
      platillo.descripcion +
      "</p>" +
      "<span>" +
      platillo.precio +
      "</span>";

    tarjeta.addEventListener("click", function () {
      abrirModalOferta(platillo.nombre, platillo.precio);
    });

    return tarjeta;
  }

  function mezclarPlatillos(listaPlatillos) {
    const copia = listaPlatillos.slice();

    for (let i = copia.length - 1; i > 0; i--) {
      const numeroAleatorio = Math.floor(Math.random() * (i + 1));
      const temporal = copia[i];

      copia[i] = copia[numeroAleatorio];
      copia[numeroAleatorio] = temporal;
    }

    return copia;
  }

  function moverCarruselConJS(carrusel) {
    let desplazamiento = 0;

    carrusel.style.animation = "none";
    carrusel.style.transition = "none";

    carrusel.addEventListener("mouseenter", function () {
      carruselPausadoPorMouse = true;
    });

    carrusel.addEventListener("mouseleave", function () {
      carruselPausadoPorMouse = false;
    });

    function animarCarrusel() {
      if (!carruselPausadoPorMouse && !carruselPausadoPorModal) {
        desplazamiento = desplazamiento + velocidadCarrusel;

        const anchoMitad = carrusel.scrollWidth / 2;

        if (desplazamiento >= anchoMitad) {
          desplazamiento = 0;
        }

        carrusel.style.transform = "translateX(-" + desplazamiento + "px)";
      }

      requestAnimationFrame(animarCarrusel);
    }

    animarCarrusel();
  }

  function abrirModalOferta(nombre, precio) {
    const modalAnterior = document.getElementById("modalOfertaIndex");

    if (modalAnterior) {
      modalAnterior.remove();
    }

    carruselPausadoPorMouse = false;
    carruselPausadoPorModal = true;

    const fondo = document.createElement("div");
    fondo.id = "modalOfertaIndex";
    fondo.className = "modal-oferta-fondo";

    const caja = document.createElement("div");
    caja.className = "modal-oferta-caja";

    caja.innerHTML = `
    <h2>Oferta seleccionada</h2>

    <p class="modal-oferta-subtitulo">
      Elegiste:
    </p>

    <h3 class="modal-oferta-nombre">
      ${nombre}
    </h3>

    <p class="modal-oferta-precio">
      Precio: ${precio}
    </p>

    <p id="mensajePedido" class="mensaje-pedido">
      Puedes agregar esta oferta a tu pedido.
    </p>

    <div class="modal-acciones">
      <button id="btnAgregarPedido" class="btn-modal btn-modal-principal">
        Agregar al pedido
      </button>

      <button id="btnIrOfertas" class="btn-modal btn-modal-secundario">
        Ver ofertas
      </button>

      <button id="btnCerrarModal" class="btn-modal btn-modal-cerrar">
        Cerrar
      </button>
    </div>
  `;

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    function cerrarModalOferta() {
      carruselPausadoPorMouse = false;
      carruselPausadoPorModal = false;
      fondo.remove();
    }

    document
      .getElementById("btnAgregarPedido")
      .addEventListener("click", function () {
        agregarAlPedido(nombre, precio);
      });

    document
      .getElementById("btnIrOfertas")
      .addEventListener("click", function () {
        carruselPausadoPorModal = false;
        window.location.href = "ofertas.html";
      });

    document
      .getElementById("btnCerrarModal")
      .addEventListener("click", function () {
        cerrarModalOferta();
      });

    fondo.addEventListener("click", function (evento) {
      if (evento.target === fondo) {
        cerrarModalOferta();
      }
    });
  }

  /* ==========================
     MENU.HTML
  ========================== */

  function iniciarMenu() {
    const menu = document.querySelector(".menu-main");

    if (!menu) {
      return;
    }

    crearFiltrosMenu();
    activarBotonesMenu();
  }

  function crearFiltrosMenu() {
    const presentacionMenu = document.querySelector(".menu-presentacion");
    const seccionesMenu = document.querySelectorAll(".menu-categoria-bloque");

    if (!presentacionMenu || seccionesMenu.length === 0) {
      return;
    }

    if (document.getElementById("filtrosMenuJs")) {
      return;
    }

    const contenedorFiltros = document.createElement("div");
    contenedorFiltros.id = "filtrosMenuJs";
    contenedorFiltros.className = "menu-filtros-js";

    const categorias = [
      { texto: "Todo", valor: "todo" },
      { texto: "Bowls y ensaladas", valor: "bowls" },
      { texto: "Platos principales", valor: "principales" },
      { texto: "Piqueos y snacks", valor: "piqueos" },
      { texto: "Bebidas", valor: "bebidas" },
    ];

    categorias.forEach(function (categoria) {
      const boton = document.createElement("button");

      boton.textContent = categoria.texto;
      boton.type = "button";
      boton.dataset.categoria = categoria.valor;
      boton.className = "menu-filtro-btn";

      if (categoria.valor === "todo") {
        boton.classList.add("filtro-activo");
      }

      boton.addEventListener("click", function () {
        filtrarMenuPorCategoria(categoria.valor);
        actualizarBotonActivoMenu(contenedorFiltros, boton);
      });

      contenedorFiltros.appendChild(boton);
    });

    presentacionMenu.after(contenedorFiltros);
  }

  function filtrarMenuPorCategoria(categoriaSeleccionada) {
    const seccionesMenu = document.querySelectorAll(".menu-categoria-bloque");

    seccionesMenu.forEach(function (seccion) {
      const categoriaSeccion = obtenerCategoriaSeccion(seccion);

      if (
        categoriaSeleccionada === "todo" ||
        categoriaSeleccionada === categoriaSeccion
      ) {
        seccion.style.display = "block";
      } else {
        seccion.style.display = "none";
      }
    });
  }

  function obtenerCategoriaSeccion(seccion) {
    const titulo = seccion.querySelector(".menu-titulo-categoria");

    if (!titulo) {
      return "";
    }

    const textoTitulo = titulo.textContent.toLowerCase();

    if (textoTitulo.includes("bowls") || textoTitulo.includes("ensaladas")) {
      return "bowls";
    }

    if (textoTitulo.includes("principales")) {
      return "principales";
    }

    if (textoTitulo.includes("piqueos") || textoTitulo.includes("snacks")) {
      return "piqueos";
    }

    if (textoTitulo.includes("bebidas")) {
      return "bebidas";
    }

    return "";
  }

  function actualizarBotonActivoMenu(contenedor, botonActivo) {
    const botones = contenedor.querySelectorAll("button");

    botones.forEach(function (boton) {
      if (boton === botonActivo) {
        boton.classList.add("filtro-activo");
      } else {
        boton.classList.remove("filtro-activo");
      }
    });
  }

  function activarBotonesMenu() {
    const botonesMenu = document.querySelectorAll(".menu-card button");

    if (botonesMenu.length === 0) {
      return;
    }

    botonesMenu.forEach(function (boton) {
      boton.addEventListener("click", function () {
        const tarjeta = boton.closest(".menu-card");

        if (!tarjeta) {
          return;
        }

        const nombre = tarjeta.querySelector("h4").textContent;
        const precio = tarjeta.querySelector(".menu-precio").textContent;

        abrirModalCantidadMenu(nombre, precio);
      });
    });
  }

  function abrirModalCantidadMenu(nombre, precio) {
    const modalAnterior = document.getElementById("modalCantidadMenu");

    if (modalAnterior) {
      modalAnterior.remove();
    }

    let cantidad = 1;

    const fondo = document.createElement("div");
    fondo.id = "modalCantidadMenu";
    fondo.className = "modal-cantidad-fondo";

    const caja = document.createElement("div");
    caja.className = "modal-cantidad-caja";

    caja.innerHTML = `
    <h2>Confirmar pedido</h2>

    <p class="modal-cantidad-texto">
      ¿Deseas agregar este platillo?
    </p>

    <h3 class="modal-cantidad-nombre">
      ${nombre}
    </h3>

    <p class="modal-cantidad-precio">
      Precio: ${precio}
    </p>

    <p class="modal-cantidad-indicacion">
      Selecciona la cantidad:
    </p>

    <div class="controles-cantidad">
      <button id="btnRestarCantidad" type="button" class="btn-cantidad btn-cantidad-restar">
        -
      </button>

      <span id="cantidadMenuSeleccionada" class="cantidad-seleccionada">
        1
      </span>

      <button id="btnSumarCantidad" type="button" class="btn-cantidad btn-cantidad-sumar">
        +
      </button>
    </div>

    <div class="modal-cantidad-acciones">
      <button id="btnConfirmarCantidad" type="button" class="btn-modal btn-confirmar-cantidad">
        Agregar al pedido
      </button>

      <button id="btnCancelarCantidad" type="button" class="btn-modal btn-cancelar-cantidad">
        Cancelar
      </button>
    </div>
  `;

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    const textoCantidad = document.getElementById("cantidadMenuSeleccionada");

    document
      .getElementById("btnSumarCantidad")
      .addEventListener("click", function () {
        cantidad = cantidad + 1;
        textoCantidad.textContent = cantidad;
      });

    document
      .getElementById("btnRestarCantidad")
      .addEventListener("click", function () {
        if (cantidad > 1) {
          cantidad = cantidad - 1;
          textoCantidad.textContent = cantidad;
        }
      });

    document
      .getElementById("btnConfirmarCantidad")
      .addEventListener("click", function () {
        const cantidadActual = agregarAlPedido(nombre, precio, cantidad);

        mostrarNotificacionMenu(
          "✅ " +
            nombre +
            " agregado al pedido. Cantidad agregada: " +
            cantidad +
            ". Total actual: " +
            cantidadActual,
        );

        fondo.remove();
      });

    document
      .getElementById("btnCancelarCantidad")
      .addEventListener("click", function () {
        fondo.remove();
      });

    fondo.addEventListener("click", function (evento) {
      if (evento.target === fondo) {
        fondo.remove();
      }
    });
  }

  function mostrarNotificacionMenu(mensaje) {
    const notificacionAnterior = document.getElementById("notificacionMenuJs");

    if (notificacionAnterior) {
      notificacionAnterior.remove();
    }

    const notificacion = document.createElement("div");
    notificacion.id = "notificacionMenuJs";
    notificacion.className = "notificacion-menu-js";
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    setTimeout(function () {
      notificacion.remove();
    }, 4500);
  }
})();
