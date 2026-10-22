class DatosBancarios {
  constructor(titular, numeroCuenta, fechaVencimiento, codigoSeguridad) {
    this.titular = titular;
    this.numeroCuenta = numeroCuenta;
    this.fechaVencimiento = fechaVencimiento;
    this.codigoSeguridad = codigoSeguridad;
  }
  validar() {
    var numero = this.numeroCuenta.split(" ").join("");
    var hoy = new Date().toISOString().slice(0, 7);
    if (this.titular.length < 3) return false;
    if (numero.length != 16 || isNaN(numero)) return false;
    if (this.fechaVencimiento == "" || this.fechaVencimiento <= hoy) return false;
    if (this.codigoSeguridad.length < 3 || isNaN(this.codigoSeguridad)) return false;
    return true;
  }
}

class Usuario {
  constructor(id, nombre, apellido, direccion, nickname, contrasena, roles, datosBancarios) {
    this.idUsuario = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.direccion = direccion;
    this.nickname = nickname;
    this.contrasena = contrasena;
    this.roles = roles;
    this.datosBancarios = datosBancarios;
    this.deseos = [];
  }
  tieneRol(rol) {
    return this.roles.indexOf(rol) != -1;
  }
  iniciarSesion(nickname, contrasena) {
    return this.nickname == nickname && this.contrasena == contrasena;
  }
  habilitarRolVendedor() {
    this.roles.push("Vendedor");
  }
  tieneDeseo(id) {
    return this.deseos.indexOf(id) != -1;
  }
  alternarDeseo(id) {
    var posicion = this.deseos.indexOf(id);
    if (posicion == -1) {
      this.deseos.push(id);
    } else {
      this.deseos.splice(posicion, 1);
    }
  }
}

class Producto {
  constructor(id, descripcion, imagen, precio, idVendedor) {
    this.idProducto = id;
    this.descripcion = descripcion;
    this.imagen = imagen;
    this.precio = precio;
    this.idVendedor = idVendedor;
    this.estado = "Disponible";
  }
  estaDisponible() {
    return this.estado == "Disponible";
  }
}

class Carrito {
  constructor() {
    this.items = [];
    this.total = 0;
  }
  agregar(producto) {
    if (this.items.indexOf(producto) == -1) {
      this.items.push(producto);
    }
    this.calcularTotal();
  }
  quitar(producto) {
    var nueva = [];
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i] != producto) nueva.push(this.items[i]);
    }
    this.items = nueva;
    this.calcularTotal();
  }
  calcularTotal() {
    this.total = 0;
    for (var i = 0; i < this.items.length; i++) {
      this.total = this.total + this.items[i].precio;
    }
    return this.total;
  }
}

class Pago {
  constructor(monto) {
    this.monto = monto;
    this.estado = "Pendiente";
  }
  procesar(datos) {
    if (datos.validar() == false) {
      this.estado = "Invalido";
      return false;
    }
    var numero = datos.numeroCuenta.split(" ").join("");
    if (numero.slice(-4) == "0000") {
      this.estado = "Rechazado";
      return false;
    }
    this.estado = "Aprobado";
    return true;
  }
}

class Compra {
  constructor(id, total, items, idComprador) {
    this.idCompra = id;
    this.fecha = new Date();
    this.total = total;
    this.estado = "Pendiente";
    this.items = items;
    this.idComprador = idComprador;
  }
  confirmar() {
    this.estado = "Confirmada";
    for (var i = 0; i < this.items.length; i++) {
      this.items[i].estado = "Vendido";
    }
  }
}

var usuarios = [
  new Usuario(1, "Ana", "Perez", "Calle 1", "comprador", "1234", ["Comprador"],
    new DatosBancarios("Ana Perez", "4111111111111111", "2030-12", "123")),
  new Usuario(2, "Luis", "Gomez", "Avenida 2", "vendedor", "1234", ["Comprador", "Vendedor"],
    new DatosBancarios("Luis Gomez", "4222222222222222", "2030-12", "123")),
  new Usuario(3, "Admin", "Sistema", "Oficina", "admin", "admin", ["Administrador"], null)
];

function crearImagen(emoji, color) {
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>" +
    "<rect width='400' height='300' fill='" + color + "'/>" +
    "<text x='200' y='190' font-size='120' text-anchor='middle'>" + emoji + "</text></svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg).split("'").join("%27");
}

var productos = [
  new Producto(101, "Laptop Gamer", crearImagen("💻", "#2b4a8a"), 899.99, 2),
  new Producto(102, "Audifonos Bluetooth", crearImagen("🎧", "#6a3a8a"), 59.9, 2),
  new Producto(103, "Teclado Mecanico", crearImagen("⌨️", "#2a7a6a"), 74.5, 2),
  new Producto(104, "Smartphone", crearImagen("📱", "#8a4a2a"), 349, 2),
  new Producto(105, "Camara Digital", crearImagen("📷", "#7a2a4a"), 420, 2),
  new Producto(106, "Reloj Inteligente", crearImagen("⌚", "#3a6a3a"), 129.99, 2)
];
var compras = [];
var siguienteIdUsuario = 4;
var siguienteIdProducto = 107;
var siguienteIdCompra = 1;

var usuarioActual = null;
var rolActual = "";
var carrito = new Carrito();
var vista = "catalogo";
var carritoAbierto = false;
var productosEnPago = [];
var textoBusqueda = "";

function puedeComprar() {

  return rolActual == "Comprador" || rolActual == "Vendedor";
}
function buscarProducto(id) {
  for (var i = 0; i < productos.length; i++) {
    if (productos[i].idProducto == id) return productos[i];
  }
  return null;
}
function buscarUsuario(id) {
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].idUsuario == id) return usuarios[i];
  }
  return null;
}
function nombreUsuario(id) {
  var usuario = buscarUsuario(id);
  if (usuario == null) return "(eliminado)";
  return usuario.nickname;
}
function dinero(n) {
  return "$" + n.toFixed(2);
}
function limpiar(texto) {
  return String(texto).split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;").split("'").join("&#39;");
}
function mensaje(texto, tipo) {
  var t = document.getElementById("toast");
  t.textContent = texto;
  t.className = "toast " + tipo;
  t.hidden = false;
  setTimeout(function () { t.hidden = true; }, 3000);
}
function ir(nombreVista) {
  vista = nombreVista;
  carritoAbierto = false;
  dibujar();
}

function dibujar() {
  dibujarMenu();
  var html = "";
  if (vista == "catalogo") html = verCatalogo();
  else if (vista == "login") html = verLogin();
  else if (vista == "registro") html = verRegistro();
  else if (vista == "vendedor") html = verPublicar();
  else if (vista == "ventas") html = verVentas();
  else if (vista == "misCompras") html = verMisCompras();
  else if (vista == "admin") html = verAdmin();
  else if (vista == "misProductos") html = verMisProductos();
  else if (vista == "deseos") html = verDeseos();
  document.getElementById("main").innerHTML = html;
}

function dibujarMenu() {
  var html = "<button class='sec' onclick=\"ir('catalogo')\">Catalogo</button>";
  if (usuarioActual == null) {
    html += "<button class='sec' onclick=\"ir('login')\">Iniciar sesion</button>";
    html += "<button onclick=\"ir('registro')\">Registrarse</button>";
  } else {
    if (puedeComprar()) {
      html += "<button class='sec' onclick=\"ir('misCompras')\">Mis compras</button>";
      html += "<button class='sec' onclick=\"ir('deseos')\">♥ Deseos (" + usuarioActual.deseos.length + ")</button>";
      html += "<span class='cartwrap'><button onclick='abrirCerrarCarrito()'>🛒 Carrito <span class='badge'>" +
        carrito.items.length + "</span></button>";
      if (carritoAbierto) html += verDesplegableCarrito();
      html += "</span>";
    }
    if (rolActual == "Vendedor") {
      html += "<button class='sec' onclick=\"ir('vendedor')\">Publicar</button>";
      html += "<button class='sec' onclick=\"ir('misProductos')\">Mis publicaciones</button>";
      html += "<button class='sec' onclick=\"ir('ventas')\">Historial de ventas</button>";
    }
    if (rolActual == "Administrador") {
      html += "<button class='sec' onclick=\"ir('admin')\">Panel admin</button>";
    }
    html += "<span class='mut'>" + limpiar(usuarioActual.nickname) + " (" + rolActual + ")</span>";
    html += "<button class='sec' onclick='cerrarSesion()'>Salir</button>";
  }
  document.getElementById("nav").innerHTML = html;
}

function verDesplegableCarrito() {
  if (carrito.items.length == 0) return "<div class='drop mut'>El carrito esta vacio.</div>";
  var html = "<div class='drop'><b>" + carrito.items.length + " articulo(s)</b>";
  for (var i = 0; i < carrito.items.length; i++) {
    var producto = carrito.items[i];
    html += "<div class='it'><span>" + limpiar(producto.descripcion) + "<br><span class='mut'>" + dinero(producto.precio) +
      "</span></span><button class='del' onclick='quitarDelCarrito(" + producto.idProducto + ")'>X</button></div>";
  }
  html += "<p style='margin:10px 0'><b>Total: " + dinero(carrito.calcularTotal()) + "</b></p>";
  html += "<button class='ok' style='width:100%' onclick='pagarCarrito()'>Proceder al pago</button></div>";
  return html;
}

function verCatalogo() {
  var html = "<h2>Catalogo</h2>";
  html += "<input placeholder='Buscar productos...' value='" + limpiar(textoBusqueda) + "' oninput='buscar(this.value)' style='max-width:400px;margin-bottom:16px'>";
  html += "<div id='lista'>" + crearTarjetas(catalogoFiltrado()) + "</div>";
  return html;
}

function catalogoFiltrado() {
  var lista = [];
  var buscado = textoBusqueda.toLowerCase();
  for (var i = 0; i < productos.length; i++) {
    var producto = productos[i];
    if (producto.estaDisponible() == false) continue;
    if (producto.descripcion.toLowerCase().indexOf(buscado) != -1) {
      lista.push(producto);
    }
  }
  return lista;
}
function buscar(texto) {
  textoBusqueda = texto;
  document.getElementById("lista").innerHTML = crearTarjetas(catalogoFiltrado());
}

function crearTarjetas(lista) {
  if (lista.length == 0) return "<p class='mut'>No se encontraron productos.</p>";
  var html = "<div class='grid'>";
  for (var i = 0; i < lista.length; i++) {
    var producto = lista[i];
    html += "<div class='card'><img src='" + producto.imagen + "' alt='producto'><div class='b'>";
    html += "<b>" + limpiar(producto.descripcion) + "</b>";
    html += "<span class='mut'>Vendedor: " + nombreUsuario(producto.idVendedor) + "</span>";
    html += "<span class='price'>" + dinero(producto.precio) + "</span>";
    if (puedeComprar() && producto.idVendedor == usuarioActual.idUsuario) {
      html += "<span class='mut'>Esta es tu publicacion</span>";
    } else if (puedeComprar()) {
      var corazon = "♡";
      if (usuarioActual.tieneDeseo(producto.idProducto)) corazon = "♥";
      html += "<div class='row'><button class='sec' onclick='agregarAlCarrito(" + producto.idProducto + ")'>Añadir al carrito</button>";
      html += "<button class='ok' onclick='comprarYa(" + producto.idProducto + ")'>Comprar ya</button>";
      html += "<button class='sec' title='Lista de deseos' onclick='alternarDeseo(" + producto.idProducto + ")'>" + corazon + "</button></div>";
    } else {
      html += "<span class='mut'>Inicia sesion para comprar</span>";
    }
    html += "</div></div>";
  }
  return html + "</div>";
}

function verDeseos() {
  var lista = [];
  for (var i = 0; i < usuarioActual.deseos.length; i++) {
    var producto = buscarProducto(usuarioActual.deseos[i]);
    if (producto != null && producto.estaDisponible()) {
      lista.push(producto);
    }
  }
  var html = "<h2>Mi lista de deseos</h2>";
  if (lista.length == 0) return html + "<p class='mut'>Aun no has guardado productos. Usa el corazon ♡ en el catalogo.</p>";
  return html + crearTarjetas(lista);
}
function alternarDeseo(id) {
  usuarioActual.alternarDeseo(id);
  dibujar();
}

function verMisProductos() {
  var html = "<h2>Mis publicaciones</h2><div class='panel'>";
  var filasTabla = "";
  for (var i = 0; i < productos.length; i++) {
    var producto = productos[i];
    if (producto.idVendedor != usuarioActual.idUsuario) continue;
    filasTabla += "<tr><td>" + producto.idProducto + "</td><td>" + limpiar(producto.descripcion) + "</td><td>" + dinero(producto.precio) +
      "</td><td>" + producto.estado + "</td><td>";
    if (producto.estado == "Disponible") {
      filasTabla += "<button class='del' onclick='eliminarMiPublicacion(" + producto.idProducto + ")'>Eliminar</button>";
    }
    filasTabla += "</td></tr>";
  }
  if (filasTabla == "") return html + "<p class='mut'>Aun no has publicado productos.</p></div>";
  return html + "<table><tr><th>ID</th><th>Producto</th><th>Precio</th><th>Estado</th><th></th></tr>" + filasTabla + "</table></div>";
}
function eliminarMiPublicacion(id) {
  var producto = buscarProducto(id);
  if (producto.idVendedor != usuarioActual.idUsuario) {
    mensaje("Solo puedes eliminar tus propias publicaciones", "err");
    return;
  }
  if (confirm("¿Eliminar la publicacion " + producto.descripcion + "?") == false) return;
  producto.estado = "Removido";
  dibujar();
  mensaje("Publicacion eliminada", "ok");
}

function verLogin() {
  return "<form onsubmit='return iniciarSesion(this)'><h2>Iniciar sesion</h2>" +
    "<label>Nickname</label><input name='nickname'>" +
    "<label>Contraseña</label><input name='contrasena' type='password'>" +
    "<button style='margin-top:16px;width:100%'>Entrar</button>" +
    "<div class='hint'>Usuarios de prueba:<br>comprador / 1234<br>vendedor / 1234 (compra y vende)<br>admin / admin<br>" +
    "La pasarela rechaza tarjetas terminadas en 0000.</div></form>";
}

function verRegistro() {
  return "<form onsubmit='return registrarse(this)'><h2>Registrarse</h2>" +
    "<label>Nombre</label><input name='nombre'>" +
    "<label>Apellido</label><input name='apellido'>" +
    "<label>Direccion</label><input name='direccion'>" +
    "<label>Nickname</label><input name='nickname'>" +
    "<label>Contraseña</label><input name='contrasena' type='password'>" +
    "<fieldset><legend>Datos bancarios</legend>" +
    "<label>Titular</label><input name='titular'>" +
    "<label>Numero de cuenta (16 digitos)</label><input name='numeroCuenta' maxlength='19'>" +
    "<label>Fecha de vencimiento</label><input name='vencimiento' type='month'>" +
    "<label>Codigo de seguridad</label><input name='codigo' maxlength='4'></fieldset>" +
    "<label>Rol</label><select name='rol'><option>Comprador</option><option>Vendedor</option></select>" +
    "<div class='row' style='margin-top:16px'><button>Registrarme</button>" +
    "<button type='button' class='sec' onclick=\"ir('catalogo')\">Cancelar</button></div>" +
    "<div class='hint'>¿Ya eres comprador y quieres vender? Escribe tu nickname y contraseña actuales y elige Vendedor.</div></form>";
}

function verPublicar() {
  return "<form onsubmit='return publicarProducto(this)'><h2>Publicar producto</h2>" +
    "<label>Nombre / descripcion</label><input name='descripcion'>" +
    "<label>Precio</label><input name='precio' type='number' step='0.01'>" +
    "<label>Imagen (JPG, PNG o WEBP, maximo 1 MB)</label><input name='img' type='file' accept='image/*'>" +
    "<button style='margin-top:16px;width:100%'>Publicar</button></form>";
}

function verVentas() {
  var html = "<h2>Historial de ventas</h2><div class='panel'>";
  var filasTabla = "";
  for (var i = 0; i < compras.length; i++) {
    var compra = compras[i];
    for (var j = 0; j < compra.items.length; j++) {
      var producto = compra.items[j];
      if (producto.idVendedor == usuarioActual.idUsuario) {
        filasTabla += "<tr><td>#" + compra.idCompra + "</td><td>" + compra.fecha.toLocaleString() + "</td><td>" +
          limpiar(producto.descripcion) + "</td><td>" + nombreUsuario(compra.idComprador) + "</td><td>" + dinero(producto.precio) + "</td></tr>";
      }
    }
  }
  if (filasTabla == "") return html + "<p class='mut'>Aun no tienes ventas.</p></div>";
  return html + "<table><tr><th>Compra</th><th>Fecha</th><th>Producto</th><th>Comprador</th><th>Monto</th></tr>" + filasTabla + "</table></div>";
}

function verMisCompras() {
  var html = "<h2>Mis compras</h2><div class='panel'>";
  var filasTabla = "";
  for (var i = 0; i < compras.length; i++) {
    var compra = compras[i];
    if (compra.idComprador != usuarioActual.idUsuario) continue;
    var nombres = "";
    for (var j = 0; j < compra.items.length; j++) {
      nombres += limpiar(compra.items[j].descripcion) + ". ";
    }
    filasTabla += "<tr><td>" + compra.idCompra + "</td><td>" + compra.fecha.toLocaleString() + "</td><td>" + nombres +
      "</td><td>" + dinero(compra.total) + "</td><td>" + compra.estado + "</td></tr>";
  }
  if (filasTabla == "") return html + "<p class='mut'>Sin compras todavia.</p></div>";
  return html + "<table><tr><th>#</th><th>Fecha</th><th>Articulos</th><th>Total</th><th>Estado</th></tr>" + filasTabla + "</table></div>";
}

function verAdmin() {
  var html = "<h2>Panel de administrador</h2><div class='panel'><h3>Usuarios</h3>";
  html += "<table><tr><th>ID</th><th>Nickname</th><th>Nombre</th><th>Roles</th><th></th></tr>";
  for (var i = 0; i < usuarios.length; i++) {
    var usuario = usuarios[i];
    html += "<tr><td>" + usuario.idUsuario + "</td><td>" + limpiar(usuario.nickname) + "</td><td>" + limpiar(usuario.nombre + " " + usuario.apellido) +
      "</td><td>" + usuario.roles.join(", ") + "</td><td>";
    if (usuario != usuarioActual) html += "<button class='del' onclick='eliminarCuenta(" + usuario.idUsuario + ")'>Eliminar cuenta</button>";
    html += "</td></tr>";
  }
  html += "</table></div><div class='panel'><h3>Publicaciones</h3>";
  html += "<table><tr><th>ID</th><th>Producto</th><th>Precio</th><th>Estado</th><th></th></tr>";
  for (var k = 0; k < productos.length; k++) {
    var producto = productos[k];
    html += "<tr><td>" + producto.idProducto + "</td><td>" + limpiar(producto.descripcion) + "</td><td>" + dinero(producto.precio) +
      "</td><td>" + producto.estado + "</td><td>";
    if (producto.estado != "Removido") html += "<button class='del' onclick='removerProducto(" + producto.idProducto + ")'>Remover</button>";
    html += "</td></tr>";
  }
  return html + "</table></div>";
}

function iniciarSesion(formulario) {
  var nickname = formulario.nickname.value.trim();
  var contrasena = formulario.contrasena.value;
  if (nickname == "" || contrasena == "") {
    mensaje("Completa todos los campos", "err");
    return false;
  }
  var encontrado = null;
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].iniciarSesion(nickname, contrasena)) encontrado = usuarios[i];
  }
  if (encontrado == null) {
    mensaje("Nickname o contraseña incorrectos", "err");
    return false;
  }
  usuarioActual = encontrado;

  if (encontrado.tieneRol("Administrador")) rolActual = "Administrador";
  else if (encontrado.tieneRol("Vendedor")) rolActual = "Vendedor";
  else rolActual = "Comprador";
  carrito = new Carrito();
  mensaje("Sesion iniciada", "ok");
  if (rolActual == "Administrador") ir("admin");
  else ir("catalogo");
  return false;
}

function cerrarSesion() {
  usuarioActual = null;
  rolActual = "";
  carrito = new Carrito();
  ir("catalogo");
}

function registrarse(formulario) {
  var nickname = formulario.nickname.value.trim();
  var rol = formulario.rol.value;
  var existente = null;
  for (var i = 0; i < usuarios.length; i++) {
    if (usuarios[i].nickname == nickname) existente = usuarios[i];
  }

  if (existente != null) {
    if (existente.contrasena != formulario.contrasena.value) {
      mensaje("Nickname ya registrado o contraseña incorrecta", "err");
    } else if (rol != "Vendedor") {
      mensaje("Ese nickname ya esta registrado, elige otro", "err");
    } else if (existente.tieneRol("Vendedor")) {
      mensaje("Ya tienes el rol Vendedor", "ok");
    } else if (existente.datosBancarios == null || existente.datosBancarios.validar() == false) {
      mensaje("Tus datos bancarios estan incompletos", "err");
    } else {
      existente.habilitarRolVendedor();
      mensaje("Rol Vendedor habilitado. Inicia sesion de nuevo", "ok");
      ir("login");
    }
    return false;
  }

  if (formulario.nombre.value.trim() == "" || formulario.apellido.value.trim() == "" || formulario.direccion.value.trim() == "" ||
      nickname == "" || formulario.contrasena.value == "") {
    mensaje("Completa los campos obligatorios", "err");
    return false;
  }
  var datos = new DatosBancarios(formulario.titular.value.trim(), formulario.numeroCuenta.value.trim(), formulario.vencimiento.value, formulario.codigo.value.trim());
  if (datos.validar() == false) {
    mensaje("Datos bancarios invalidos", "err");
    return false;
  }
  var roles = ["Comprador"];
  if (rol == "Vendedor") roles.push("Vendedor");
  var nuevo = new Usuario(siguienteIdUsuario, formulario.nombre.value.trim(), formulario.apellido.value.trim(), formulario.direccion.value.trim(),
    nickname, formulario.contrasena.value, roles, datos);
  siguienteIdUsuario++;
  usuarios.push(nuevo);
  mensaje("Registro exitoso. Inicia sesion", "ok");
  ir("login");
  return false;
}

function publicarProducto(formulario) {
  var descripcion = formulario.descripcion.value.trim();
  var precio = parseFloat(formulario.precio.value);
  var archivo = formulario.img.files[0];
  if (descripcion == "" || formulario.precio.value == "" || archivo == undefined) {
    mensaje("Completa todos los campos", "err");
    return false;
  }
  if (precio <= 0) {
    mensaje("Precio invalido", "err");
    return false;
  }
  var tipoOk = archivo.type == "image/jpeg" || archivo.type == "image/png" || archivo.type == "image/webp";
  if (tipoOk == false || archivo.size > 1000000) {
    mensaje("Imagen no permitida (JPG, PNG o WEBP, maximo 1 MB)", "err");
    return false;
  }
  var lector = new FileReader();
  lector.onload = function () {
    var nuevo = new Producto(siguienteIdProducto, descripcion, lector.result, precio, usuarioActual.idUsuario);
    siguienteIdProducto++;
    productos.push(nuevo);
    mensaje("Producto publicado", "ok");
    ir("catalogo");
  };
  lector.readAsDataURL(archivo);
  return false;
}

function abrirCerrarCarrito() {
  carritoAbierto = !carritoAbierto;
  dibujarMenu();
}
function agregarAlCarrito(id) {
  carrito.agregar(buscarProducto(id));
  dibujarMenu();
  mensaje("Añadido al carrito", "ok");
}
function quitarDelCarrito(id) {
  carrito.quitar(buscarProducto(id));
  dibujarMenu();
}

function comprarYa(id) {
  abrirPago([buscarProducto(id)]);
}
function pagarCarrito() {
  carritoAbierto = false;
  dibujarMenu();
  abrirPago(carrito.items.slice());
}

function abrirPago(lista) {
  var disponibles = [];
  var total = 0;
  for (var i = 0; i < lista.length; i++) {
    if (lista[i].estaDisponible()) {
      disponibles.push(lista[i]);
      total = total + lista[i].precio;
    }
  }
  if (disponibles.length == 0) {
    mensaje("El producto ya no esta disponible", "err");
    ir("catalogo");
    return;
  }
  productosEnPago = disponibles;
  var datos = usuarioActual.datosBancarios;
  var html = "<form onsubmit='return confirmarPago(this)'><h2>Resumen de compra</h2>";
  for (var j = 0; j < disponibles.length; j++) {
    html += "<p>" + limpiar(disponibles[j].descripcion) + " - <b>" + dinero(disponibles[j].precio) + "</b></p>";
  }
  html += "<h3>Total: " + dinero(total) + "</h3><fieldset><legend>Datos bancarios</legend>";
  html += "<label>Titular</label><input name='titular' value='" + limpiar(datos.titular) + "'>";
  html += "<label>Numero de cuenta</label><input name='numeroCuenta' value='" + datos.numeroCuenta + "'>";
  html += "<label>Vencimiento</label><input name='vencimiento' type='month' value='" + datos.fechaVencimiento + "'>";
  html += "<label>Codigo</label><input name='codigo' value='" + datos.codigoSeguridad + "'></fieldset>";
  html += "<div class='row' style='margin-top:16px'><button class='ok'>Confirmar compra</button>";
  html += "<button type='button' class='sec' onclick='cerrarPago()'>Cancelar</button></div></form>";
  var modal = document.getElementById("modal");
  modal.innerHTML = html;
  modal.hidden = false;
}

function cerrarPago() {
  document.getElementById("modal").hidden = true;
}

function confirmarPago(formulario) {
  var datos = new DatosBancarios(formulario.titular.value.trim(), formulario.numeroCuenta.value.trim(), formulario.vencimiento.value, formulario.codigo.value.trim());
  if (datos.validar() == false) {
    mensaje("Datos bancarios invalidos", "err");
    return false;
  }
  var total = 0;
  for (var i = 0; i < productosEnPago.length; i++) {
    total = total + productosEnPago[i].precio;
  }
  var pago = new Pago(total);
  if (pago.procesar(datos) == false) {
    mensaje("Pago rechazado por la pasarela", "err");
    return false;
  }

  var compra = new Compra(siguienteIdCompra, total, productosEnPago, usuarioActual.idUsuario);
  siguienteIdCompra++;
  compra.confirmar();
  compras.push(compra);
  for (var j = 0; j < productosEnPago.length; j++) {
    carrito.quitar(productosEnPago[j]);
  }
  cerrarPago();
  mensaje("Compra #" + compra.idCompra + " confirmada: " + dinero(total), "ok");
  ir("misCompras");
  return false;
}

function eliminarCuenta(id) {
  var usuario = buscarUsuario(id);
  if (confirm("¿Eliminar la cuenta de " + usuario.nickname + "?") == false) return;
  for (var i = 0; i < productos.length; i++) {
    if (productos[i].idVendedor == id) productos[i].estado = "Removido";
  }
  var nueva = [];
  for (var j = 0; j < usuarios.length; j++) {
    if (usuarios[j] != usuario) nueva.push(usuarios[j]);
  }
  usuarios = nueva;
  dibujar();
  mensaje("Cuenta eliminada", "ok");
}

function removerProducto(id) {
  var producto = buscarProducto(id);
  producto.estado = "Removido";
  dibujar();
  mensaje("Producto removido", "ok");
}

dibujar();
