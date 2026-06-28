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
    actualizarVistaUsuario();
  }

  function obtenerUsuarioActivo() {
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

  function actualizarVistaUsuario() {
    const usuarioActivo = obtenerUsuarioActivo();

    if (!usuarioActivo) {
      return;
    }

    cambiarMenuLogin(usuarioActivo.nombre);
    cambiarTituloBienvenida(usuarioActivo.nombre);
  }

  function cambiarMenuLogin(usuario) {
    const enlaces = document.querySelectorAll("nav a");

    enlaces.forEach(function (enlace) {
      if (enlace.textContent.trim() === "Login") {
        const itemLista = enlace.closest("li");

        enlace.textContent = "👤 " + usuario;
        enlace.href = "#";
        enlace.classList.add("usuario-nav-link");

        const menuUsuario = document.createElement("div");
        menuUsuario.className = "usuario-menu-desplegable";
        menuUsuario.innerHTML = `
        <button type="button" id="btnCambiarNombreUsuario">
          ✏️ Cambiar nombre
        </button>

        <button type="button" id="btnDesactivarCuentaUsuario">
          🚫 Desactivar cuenta
        </button>

        <button type="button" id="btnCerrarSesionUsuario">
          🚪 Cerrar sesión
        </button>
      `;

        itemLista.classList.add("usuario-nav-contenedor");
        itemLista.appendChild(menuUsuario);

        enlace.addEventListener("click", function (evento) {
          evento.preventDefault();
          menuUsuario.classList.toggle("mostrar-menu-usuario");
        });

        document.addEventListener("click", function (evento) {
          if (!itemLista.contains(evento.target)) {
            menuUsuario.classList.remove("mostrar-menu-usuario");
          }
        });

        document
          .getElementById("btnCambiarNombreUsuario")
          .addEventListener("click", function () {
            menuUsuario.classList.remove("mostrar-menu-usuario");
            abrirModalCambiarNombre();
          });

        document
          .getElementById("btnDesactivarCuentaUsuario")
          .addEventListener("click", function () {
            menuUsuario.classList.remove("mostrar-menu-usuario");
            abrirModalDesactivarCuenta();
          });

        document
          .getElementById("btnCerrarSesionUsuario")
          .addEventListener("click", function () {
            menuUsuario.classList.remove("mostrar-menu-usuario");
            abrirModalCerrarSesion();
          });
      }
    });
  }

  function abrirModalCambiarNombre() {
    const usuarioActivo = obtenerUsuarioActivo();

    if (!usuarioActivo) {
      return;
    }

    crearModalUsuario(`
    <h2>Cambiar nombre</h2>

    <p class="modal-usuario-texto">
      Actualiza el nombre que se mostrará en tu cuenta.
    </p>

    <label class="modal-usuario-label" for="nuevoNombreUsuario">
      Nuevo nombre:
    </label>

    <input
      type="text"
      id="nuevoNombreUsuario"
      class="modal-usuario-input"
      value="${usuarioActivo.nombre}"
      autocomplete="name"
    >

    <p id="mensajeModalUsuario" class="modal-usuario-mensaje"></p>

    <div class="modal-usuario-acciones">
      <button type="button" id="btnGuardarNuevoNombre" class="btn-modal-usuario btn-modal-confirmar">
        Guardar cambios
      </button>

      <button type="button" id="btnCancelarModalUsuario" class="btn-modal-usuario btn-modal-cancelar">
        Cancelar
      </button>
    </div>
  `);

    document
      .getElementById("btnGuardarNuevoNombre")
      .addEventListener("click", actualizarNombreUsuario);

    document
      .getElementById("btnCancelarModalUsuario")
      .addEventListener("click", cerrarModalUsuario);
  }

  async function actualizarNombreUsuario() {
    const usuarioActivo = obtenerUsuarioActivo();
    const inputNombre = document.getElementById("nuevoNombreUsuario");
    const mensaje = document.getElementById("mensajeModalUsuario");

    const nuevoNombre = inputNombre.value.trim();

    if (nuevoNombre.length < 3) {
      mensaje.textContent = "El nombre debe tener al menos 3 caracteres.";
      mensaje.className = "modal-usuario-mensaje error";
      return;
    }

    try {
      const respuesta = await fetch(
        "http://localhost:4000/api/usuarios/" + usuarioActivo.id + "/nombre",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nuevoNombre,
          }),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        mensaje.textContent = datos.mensaje;
        mensaje.className = "modal-usuario-mensaje error";
        return;
      }

      localStorage.setItem("usuarioActivoMrsGreenSpoon", datos.usuario.nombre);

      mensaje.textContent = "Nombre actualizado correctamente.";
      mensaje.className = "modal-usuario-mensaje exito";

      setTimeout(function () {
        window.location.reload();
      }, 1200);
    } catch (error) {
      console.error("Error al actualizar nombre:", error);
      mensaje.textContent = "No se pudo conectar con el servidor.";
      mensaje.className = "modal-usuario-mensaje error";
    }
  }

  function abrirModalDesactivarCuenta() {
    crearModalUsuario(`
    <h2>Desactivar cuenta</h2>

    <p class="modal-usuario-texto">
      Tu cuenta será desactivada. No se eliminará tu información, pero no podrás iniciar sesión hasta solicitar una reactivación.
    </p>

    <p class="modal-usuario-advertencia">
      Para volver a activarla, deberás iniciar sesión con tus credenciales y solicitar la reactivación.
    </p>

    <div class="modal-usuario-acciones">
      <button type="button" id="btnConfirmarDesactivarCuenta" class="btn-modal-usuario btn-modal-peligro">
        Sí, desactivar
      </button>

      <button type="button" id="btnCancelarModalUsuario" class="btn-modal-usuario btn-modal-cancelar">
        Cancelar
      </button>
    </div>
  `);

    document
      .getElementById("btnConfirmarDesactivarCuenta")
      .addEventListener("click", desactivarCuentaUsuario);

    document
      .getElementById("btnCancelarModalUsuario")
      .addEventListener("click", cerrarModalUsuario);
  }

  async function desactivarCuentaUsuario() {
    const usuarioActivo = obtenerUsuarioActivo();

    if (!usuarioActivo) {
      return;
    }

    try {
      const respuesta = await fetch(
        "http://localhost:4000/api/usuarios/" +
          usuarioActivo.id +
          "/deshabilitar",
        {
          method: "PATCH",
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alert(datos.mensaje);
        return;
      }

      cerrarSesionSinConfirmacion();
    } catch (error) {
      console.error("Error al desactivar cuenta:", error);
      alert("No se pudo conectar con el servidor.");
    }
  }

  function abrirModalCerrarSesion() {
    crearModalUsuario(`
    <h2>Cerrar sesión</h2>

    <p class="modal-usuario-texto">
      ¿Deseas cerrar tu sesión actual?
    </p>

    <div class="modal-usuario-acciones">
      <button type="button" id="btnConfirmarCerrarSesion" class="btn-modal-usuario btn-modal-confirmar">
        Sí, cerrar sesión
      </button>

      <button type="button" id="btnCancelarModalUsuario" class="btn-modal-usuario btn-modal-cancelar">
        Cancelar
      </button>
    </div>
  `);

    document
      .getElementById("btnConfirmarCerrarSesion")
      .addEventListener("click", cerrarSesionSinConfirmacion);

    document
      .getElementById("btnCancelarModalUsuario")
      .addEventListener("click", cerrarModalUsuario);
  }

  function crearModalUsuario(contenido) {
    const modalAnterior = document.getElementById("modalUsuario");

    if (modalAnterior) {
      modalAnterior.remove();
    }

    const fondo = document.createElement("div");
    fondo.id = "modalUsuario";
    fondo.className = "modal-usuario-fondo";

    const caja = document.createElement("div");
    caja.className = "modal-usuario-caja";

    caja.innerHTML = contenido;

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    fondo.addEventListener("click", function (evento) {
      if (evento.target === fondo) {
        cerrarModalUsuario();
      }
    });
  }

  function cerrarModalUsuario() {
    const modal = document.getElementById("modalUsuario");

    if (modal) {
      modal.remove();
    }
  }

  function cerrarSesionSinConfirmacion() {
    localStorage.removeItem("usuarioActivoMrsGreenSpoon");
    localStorage.removeItem("usuarioIdMrsGreenSpoon");
    localStorage.removeItem("usuarioCorreoMrsGreenSpoon");

    window.location.href = "login.html";
  }

  function cambiarTituloBienvenida(usuario) {
    const tituloBienvenida = document.querySelector(".seccion-bienvenida h2");

    if (!tituloBienvenida) {
      return;
    }

    tituloBienvenida.textContent =
      "Bienvenido " + usuario + " a Mrs. Green Spoon";
  }

  function agregarAlPedido(
    nombre,
    precio,
    cantidad = 1,
    idProducto = null,
    precioNumero = null,
  ) {
    const pedidoGuardado = localStorage.getItem("pedidoMrsGreenSpoon");
    let pedido = [];
    let cantidadActual = cantidad;

    if (pedidoGuardado) {
      pedido = JSON.parse(pedidoGuardado);
    }

    const precioFinal =
      precioNumero !== null
        ? Number(precioNumero)
        : convertirPrecioANumero(precio);

    const precioTexto =
      typeof precio === "string" && precio.includes("S/")
        ? precio
        : "S/ " + precioFinal.toFixed(2);

    const productoExistente = pedido.find(function (producto) {
      if (idProducto && producto.id_producto) {
        return Number(producto.id_producto) === Number(idProducto);
      }

      return producto.nombre === nombre;
    });

    if (productoExistente) {
      productoExistente.id_producto =
        idProducto || productoExistente.id_producto;
      productoExistente.precio = precioFinal;
      productoExistente.precioTexto = precioTexto;
      productoExistente.cantidad = productoExistente.cantidad + cantidad;
      cantidadActual = productoExistente.cantidad;
    } else {
      pedido.push({
        id_producto: idProducto,
        nombre: nombre,
        precio: precioFinal,
        precioTexto: precioTexto,
        cantidad: cantidad,
      });
    }

    localStorage.setItem("pedidoMrsGreenSpoon", JSON.stringify(pedido));

    const mensaje = document.getElementById("mensajePedido");

    if (mensaje) {
      mensaje.textContent =
        "Producto agregado al pedido correctamente. Cantidad actual: " +
        cantidadActual;
      mensaje.className = "mensaje-pedido exito";
    }

    console.log("Pedido completo actualizado:");
    console.table(pedido);

    return cantidadActual;
  }

  function convertirPrecioANumero(precio) {
    if (typeof precio === "number") {
      return precio;
    }

    return Number(precio.replace("S/", "").trim());
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

  async function cargarCarruselIndex() {
    const carrusel = document.querySelector(".carrusel-ofertas");

    if (!carrusel) {
      return;
    }

    try {
      const respuesta = await fetch(
        "http://localhost:4000/api/productos/economicos",
      );
      const productos = await respuesta.json();

      if (!respuesta.ok) {
        carrusel.innerHTML =
          "<p>No se pudieron cargar los productos destacados.</p>";
        return;
      }

      if (productos.length === 0) {
        carrusel.innerHTML =
          "<p>No hay productos disponibles por el momento.</p>";
        return;
      }

      carrusel.innerHTML = "";
      carrusel.style.animation = "none";
      carrusel.style.transition = "none";
      carrusel.style.transform = "translateX(0)";

      productos.forEach(function (producto) {
        const tarjeta = crearTarjetaCarrusel(producto);
        carrusel.appendChild(tarjeta);
      });

      productos.forEach(function (producto) {
        const tarjetaDuplicada = crearTarjetaCarrusel(producto);
        carrusel.appendChild(tarjetaDuplicada);
      });

      moverCarruselConJS(carrusel);
    } catch (error) {
      console.error("Error al cargar carrusel:", error);
      carrusel.innerHTML = "<p>No se pudo conectar con el servidor.</p>";
    }
  }

  function crearTarjetaCarrusel(producto) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "destacada-card";

    const precioFormateado = "S/ " + Number(producto.precio).toFixed(2);

    tarjeta.innerHTML =
      '<img src="' +
      producto.imagen +
      '" alt="' +
      producto.nombre +
      '">' +
      "<h4>" +
      producto.nombre +
      "</h4>" +
      "<p>" +
      producto.descripcion +
      "</p>" +
      "<span>" +
      precioFormateado +
      "</span>";

    tarjeta.addEventListener("click", function () {
      abrirModalOferta(
        producto.id_producto,
        producto.nombre,
        precioFormateado,
        Number(producto.precio),
      );
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

  function abrirModalOferta(idProducto, nombre, precioTexto, precioNumero) {
    const modalAnterior = document.getElementById("modalOfertaIndex");

    if (modalAnterior) {
      modalAnterior.remove();
    }

    carruselPausadoPorMouse = false;
    carruselPausadoPorModal = true;

    const usuarioActivo = obtenerUsuarioActivo();

    const fondo = document.createElement("div");
    fondo.id = "modalOfertaIndex";
    fondo.className = "modal-oferta-fondo";

    const caja = document.createElement("div");
    caja.className = "modal-oferta-caja";

    if (usuarioActivo) {
      caja.innerHTML = `
      <h2>Producto destacado</h2>

      <p class="modal-oferta-subtitulo">
        Seleccionaste:
      </p>

      <h3 class="modal-oferta-nombre">
        ${nombre}
      </h3>

      <p class="modal-oferta-precio">
        Precio: ${precioTexto}
      </p>

      <p id="mensajePedido" class="mensaje-pedido info">
      Puedes agregar 1 unidad rápidamente o ir al menú para elegir más cantidades.
      </p>

      <div class="modal-acciones">
        <button id="btnAgregarPedido" class="btn-modal btn-modal-principal">
          Agregar al pedido
        </button>

        <button id="btnIrMenu" class="btn-modal btn-modal-secundario">
          Ir al menú
        </button>

        <button id="btnCerrarModal" class="btn-modal btn-modal-cerrar">
          Cerrar
        </button>
      </div>
    `;
    } else {
      caja.innerHTML = `
      <h2>Inicia sesión</h2>

      <p class="modal-oferta-subtitulo">
        Seleccionaste:
      </p>

      <h3 class="modal-oferta-nombre">
        ${nombre}
      </h3>

      <p class="modal-oferta-precio">
        Precio: ${precioTexto}
      </p>

      <p id="mensajePedido" class="mensaje-pedido advertencia">
      Para agregar productos al pedido primero debes iniciar sesión.
      </p>

      <div class="modal-acciones">
        <button id="btnIrLogin" class="btn-modal btn-modal-principal">
          Iniciar sesión
        </button>

        <button id="btnIrMenu" class="btn-modal btn-modal-secundario">
          Ir al menú
        </button>

        <button id="btnCerrarModal" class="btn-modal btn-modal-cerrar">
          Cerrar
        </button>
      </div>
    `;
    }

    fondo.appendChild(caja);
    document.body.appendChild(fondo);

    function cerrarModalOferta() {
      carruselPausadoPorMouse = false;
      carruselPausadoPorModal = false;
      fondo.remove();
    }

    const btnAgregarPedido = document.getElementById("btnAgregarPedido");
    const btnIrMenu = document.getElementById("btnIrMenu");
    const btnIrLogin = document.getElementById("btnIrLogin");
    const btnCerrarModal = document.getElementById("btnCerrarModal");

    if (btnAgregarPedido) {
      btnAgregarPedido.addEventListener("click", function () {
        const cantidadActual = agregarAlPedido(
          nombre,
          precioTexto,
          1,
          idProducto,
          precioNumero,
        );

        const mensaje = document.getElementById("mensajePedido");

        mensaje.textContent =
          "Producto agregado al pedido correctamente. Cantidad actual: " +
          cantidadActual;

        mensaje.className = "mensaje-pedido exito";
      });
    }

    if (btnIrMenu) {
      btnIrMenu.addEventListener("click", function () {
        carruselPausadoPorModal = false;
        window.location.href = "menu.html";
      });
    }

    if (btnIrLogin) {
      btnIrLogin.addEventListener("click", function () {
        carruselPausadoPorModal = false;
        window.location.href = "login.html";
      });
    }

    btnCerrarModal.addEventListener("click", function () {
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

  async function iniciarMenu() {
    const menu = document.querySelector(".menu-main");

    if (!menu) {
      return;
    }

    await cargarMenuDesdeBD();
    crearFiltrosMenu();
    activarBotonesMenu();
  }

  async function cargarMenuDesdeBD() {
    const menu = document.querySelector(".menu-main");

    if (!menu) {
      return;
    }

    try {
      const respuesta = await fetch("http://localhost:4000/api/productos");
      const productos = await respuesta.json();

      if (!respuesta.ok) {
        mostrarMensajeMenuBD("No se pudieron cargar los productos del menú.");
        return;
      }

      if (productos.length === 0) {
        mostrarMensajeMenuBD("No hay productos disponibles por el momento.");
        return;
      }

      limpiarMenuActual();
      crearSeccionesMenuDesdeProductos(productos);
    } catch (error) {
      console.error("Error al cargar productos del menú:", error);
      mostrarMensajeMenuBD("No se pudo conectar con el servidor.");
    }
  }

  function limpiarMenuActual() {
    const seccionesAntiguas = document.querySelectorAll(
      ".menu-categoria-bloque",
    );
    const filtrosAntiguos = document.getElementById("filtrosMenuJs");

    seccionesAntiguas.forEach(function (seccion) {
      seccion.remove();
    });

    if (filtrosAntiguos) {
      filtrosAntiguos.remove();
    }
  }

  function mostrarMensajeMenuBD(mensaje) {
    limpiarMenuActual();

    const presentacionMenu = document.querySelector(".menu-presentacion");

    if (!presentacionMenu) {
      return;
    }

    const mensajeCaja = document.createElement("div");
    mensajeCaja.id = "mensajeMenuBD";
    mensajeCaja.className = "menu-mensaje-bd";
    mensajeCaja.textContent = mensaje;

    presentacionMenu.after(mensajeCaja);
  }

  function crearSeccionesMenuDesdeProductos(productos) {
    const menuFinal = document.querySelector(".menu-final");
    const menuMain = document.querySelector(".menu-main");

    const categoriasOrdenadas = [
      {
        clave: "bowls",
        titulo: "Bowls y ensaladas",
        icono: "fa-solid fa-bowl-food",
      },
      {
        clave: "principales",
        titulo: "Platos principales",
        icono: "fa-solid fa-pizza-slice",
      },
      {
        clave: "piqueos",
        titulo: "Piqueos y snacks",
        icono: "fa-solid fa-cheese",
      },
      {
        clave: "bebidas",
        titulo: "Bebidas naturales",
        icono: "fa-solid fa-glass-water",
      },
    ];

    categoriasOrdenadas.forEach(function (categoria) {
      const productosCategoria = productos.filter(function (producto) {
        return (
          obtenerClaveCategoriaProducto(producto.categoria) === categoria.clave
        );
      });

      if (productosCategoria.length === 0) {
        return;
      }

      const seccion = crearSeccionCategoriaMenu(categoria, productosCategoria);

      if (menuFinal) {
        menuFinal.before(seccion);
      } else {
        menuMain.appendChild(seccion);
      }
    });
  }

  function obtenerClaveCategoriaProducto(nombreCategoria) {
    const categoria = nombreCategoria.toLowerCase();

    if (categoria.includes("bowl") || categoria.includes("ensalada")) {
      return "bowls";
    }

    if (categoria.includes("principal")) {
      return "principales";
    }

    if (categoria.includes("piqueo") || categoria.includes("snack")) {
      return "piqueos";
    }

    if (categoria.includes("bebida")) {
      return "bebidas";
    }

    return "otros";
  }

  function crearSeccionCategoriaMenu(categoria, productos) {
    const seccion = document.createElement("section");
    seccion.className = "menu-categoria-bloque";
    seccion.dataset.categoria = categoria.clave;

    seccion.innerHTML = `
    <h3 class="menu-titulo-categoria">
      <i class="${categoria.icono}"></i>
      ${categoria.titulo}
    </h3>

    <div class="menu-grid"></div>
  `;

    const grid = seccion.querySelector(".menu-grid");

    productos.forEach(function (producto) {
      const tarjeta = crearTarjetaMenuDesdeProducto(producto);
      grid.appendChild(tarjeta);
    });

    return seccion;
  }

  function crearTarjetaMenuDesdeProducto(producto) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "menu-card";

    const precioNumero = Number(producto.precio);
    const precioTexto = "S/ " + precioNumero.toFixed(2);
    const stock = Number(producto.stock);

    tarjeta.dataset.idProducto = producto.id_producto;
    tarjeta.dataset.precioNumero = precioNumero;
    tarjeta.dataset.stock = stock;

    if (stock <= 0) {
      tarjeta.classList.add("menu-card-agotado");
    }

    const textoBoton =
      stock > 0
        ? '<i class="fa-solid fa-basket-shopping"></i> Añadir'
        : '<i class="fa-solid fa-circle-xmark"></i> Agotado';

    tarjeta.innerHTML = `
    ${stock <= 3 && stock > 0 ? '<span class="menu-badge">Últimas unidades</span>' : ""}

    <img src="${producto.imagen}" alt="${producto.nombre}" />

    <div class="menu-info">
      <h4>${producto.nombre}</h4>

      <p>${producto.descripcion}</p>

      <span class="menu-precio">${precioTexto}</span>

      <span class="${stock > 0 ? "menu-stock" : "menu-stock agotado"}">
        ${stock > 0 ? "Stock disponible: " + stock : "Agotado"}
      </span>

      <button type="button" ${stock <= 0 ? "disabled" : ""}>
        ${textoBoton}
      </button>
    </div>
  `;

    return tarjeta;
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
      const categoriaSeccion = seccion.dataset.categoria;

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
      boton.addEventListener("click", async function () {
        const usuarioActivo = obtenerUsuarioActivo();

        if (!usuarioActivo) {
          const irLogin = await mostrarModalSistema({
            icono: "🔒",
            titulo: "Inicia sesión",
            mensaje:
              "Para agregar productos al pedido primero debes iniciar sesión.",
            textoConfirmar: "Iniciar sesión",
            textoCancelar: "Seguir viendo",
          });

          if (irLogin) {
            window.location.href = "login.html";
          }

          return;
        }

        const tarjeta = boton.closest(".menu-card");

        if (!tarjeta) {
          return;
        }

        const idProducto = tarjeta.dataset.idProducto;
        const precioNumero = Number(tarjeta.dataset.precioNumero);
        const stock = Number(tarjeta.dataset.stock);
        const nombre = tarjeta.querySelector("h4").textContent;
        const precioTexto = tarjeta.querySelector(".menu-precio").textContent;

        if (stock <= 0) {
          mostrarModalSistema({
            icono: "🚫",
            titulo: "Producto agotado",
            mensaje: "Este producto no tiene stock disponible por el momento.",
            textoConfirmar: "Entendido",
          });

          return;
        }

        const cantidadEnPedido = obtenerCantidadProductoEnPedido(
          idProducto,
          nombre,
        );

        const stockRestante = stock - cantidadEnPedido;

        if (stockRestante <= 0) {
          mostrarModalSistema({
            icono: "⚠️",
            titulo: "Stock alcanzado",
            mensaje:
              "Ya agregaste al pedido todas las unidades disponibles de este producto.",
            textoConfirmar: "Entendido",
          });

          return;
        }

        abrirModalCantidadMenu(
          nombre,
          precioTexto,
          idProducto,
          precioNumero,
          stock,
        );
      });
    });
  }

  function obtenerCantidadProductoEnPedido(idProducto, nombre) {
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

  function abrirModalCantidadMenu(
    nombre,
    precioTexto,
    idProducto,
    precioNumero,
    stock,
  ) {
    const modalAnterior = document.getElementById("modalCantidadMenu");

    if (modalAnterior) {
      modalAnterior.remove();
    }

    const cantidadEnPedido = obtenerCantidadProductoEnPedido(
      idProducto,
      nombre,
    );
    const stockRestante = stock - cantidadEnPedido;

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
      Precio: ${precioTexto}
    </p>

    <p class="modal-cantidad-stock">
      Stock disponible: ${stock} 
      ${cantidadEnPedido > 0 ? " | Ya en pedido: " + cantidadEnPedido : ""}
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

    <p id="mensajeStockMenu" class="modal-stock-mensaje"></p>

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
    const mensajeStock = document.getElementById("mensajeStockMenu");

    document
      .getElementById("btnSumarCantidad")
      .addEventListener("click", function () {
        if (cantidad < stockRestante) {
          cantidad = cantidad + 1;
          textoCantidad.textContent = cantidad;
          mensajeStock.textContent = "";
        } else {
          mensajeStock.textContent =
            "No puedes superar el stock disponible para este producto.";
        }
      });

    document
      .getElementById("btnRestarCantidad")
      .addEventListener("click", function () {
        if (cantidad > 1) {
          cantidad = cantidad - 1;
          textoCantidad.textContent = cantidad;
          mensajeStock.textContent = "";
        }
      });

    document
      .getElementById("btnConfirmarCantidad")
      .addEventListener("click", function () {
        const cantidadActual = agregarAlPedido(
          nombre,
          precioTexto,
          cantidad,
          idProducto,
          precioNumero,
        );

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

  function validarCorreoMrsGreenSpoon(correo) {
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patronCorreo.test(correo);
  }

  function mostrarModalSistema(opciones) {
    return new Promise(function (resolve) {
      const modalAnterior = document.getElementById("modalSistema");

      if (modalAnterior) {
        modalAnterior.remove();
      }

      const fondo = document.createElement("div");
      fondo.id = "modalSistema";
      fondo.className = "modal-sistema-fondo";

      const caja = document.createElement("div");
      caja.className = "modal-sistema-caja";

      const icono = opciones.icono || "🥄";
      const titulo = opciones.titulo || "Mensaje";
      const mensaje = opciones.mensaje || "";
      const textoConfirmar = opciones.textoConfirmar || "Aceptar";
      const textoCancelar = opciones.textoCancelar || "";

      caja.innerHTML = `
        <div class="modal-sistema-icono">${icono}</div>

        <h2>${titulo}</h2>

        <p>${mensaje}</p>

        <div class="modal-sistema-acciones">
          <button type="button" id="btnModalSistemaConfirmar" class="btn-modal-sistema btn-modal-sistema-confirmar">
            ${textoConfirmar}
          </button>

          ${
            textoCancelar
              ? `<button type="button" id="btnModalSistemaCancelar" class="btn-modal-sistema btn-modal-sistema-cancelar">
                  ${textoCancelar}
                </button>`
              : ""
          }
        </div>
      `;

      fondo.appendChild(caja);
      document.body.appendChild(fondo);

      document
        .getElementById("btnModalSistemaConfirmar")
        .addEventListener("click", function () {
          fondo.remove();
          resolve(true);
        });

      const botonCancelar = document.getElementById("btnModalSistemaCancelar");

      if (botonCancelar) {
        botonCancelar.addEventListener("click", function () {
          fondo.remove();
          resolve(false);
        });
      }

      fondo.addEventListener("click", function (evento) {
        if (evento.target === fondo) {
          fondo.remove();
          resolve(false);
        }
      });
    });
  }

  window.validarCorreoMrsGreenSpoon = validarCorreoMrsGreenSpoon;
  window.mostrarModalSistema = mostrarModalSistema;
})();
