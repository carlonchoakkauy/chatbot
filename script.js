// Estado interno en memoria (sin almacenamiento externo)
let arbolDecision = {};
let memoriaUsuario = {
  nombre: '',
  elecciones: []
};

// Referencias a las partes exactas definidas en el boceto
const zonaDeChat = document.getElementById('zona-de-chat');
const zonaDeMensaje = document.getElementById('zona-de-mensaje');

// Iniciar la aplicación al cargar el documento
document.addEventListener('DOMContentLoaded', cargarConversacion);

// Carga el árbol de decisiones desde el archivo JSON local
function cargarConversacion() {
  fetch('arbol_decision.json')
    .then(respuesta => {
      if (!respuesta.ok) {
        throw new Error('Error HTTP');
      }
      return respuesta.json();
    })
    .then(datos => {
      arbolDecision = datos;
      mostrarNodo('inicio');
    })
    .catch(() => {
      mostrarMensaje(
        'Abrí el proyecto con Live Server o un servidor local para que pueda leer arbol_decision.json',
        'error-sistema'
      );
    });
}

// Renderiza un nodo del árbol en la zona de chat y sus controles en la zona de mensaje
function mostrarNodo(idNodo) {
  const nodo = arbolDecision[idNodo];
  if (!nodo) return;

  // Si el nodo solicita reiniciar el historial en pantalla y la memoria
  if (nodo.reiniciar) {
    zonaDeChat.innerHTML = '';
    memoriaUsuario = { nombre: '', elecciones: [] };
  }

  // Personaliza el texto con los datos recordados de la sesión
  const textoProcesado = reemplazarVariables(nodo.texto);
  mostrarMensaje(textoProcesado, 'bot');

  // Limpiar controles anteriores en la zona de mensaje
  zonaDeMensaje.innerHTML = '';

  // Si el nodo requiere un ingreso puntual de datos (<input>)
  if (nodo.input) {
    renderizarCampoEntrada(nodo);
  }

  // Renderizar opciones de navegación por botones
  if (Array.isArray(nodo.opciones)) {
    nodo.opciones.forEach(opcion => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-opcion';
      if (opcion.estilo === 'secundario') {
        boton.classList.add('secundario');
      }
      boton.textContent = opcion.texto;

      boton.addEventListener('click', () => {
        mostrarMensaje(opcion.texto, 'usuario');
        guardarEleccion(nodo, opcion.texto);
        mostrarNodo(opcion.siguiente);
      });

      zonaDeMensaje.appendChild(boton);
    });
  }
}

// Crea un formulario puntual con validación de formato según lo indicado en el JSON
function renderizarCampoEntrada(nodo) {
  const formulario = document.createElement('form');
  formulario.className = 'form-dato';

  const fila = document.createElement('div');
  fila.className = 'fila-input';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'campo-dato';
  input.placeholder = nodo.input.placeholder || '';
  input.autocomplete = 'off';

  const botonEnviar = document.createElement('button');
  botonEnviar.type = 'submit';
  botonEnviar.className = 'btn-enviar-dato';
  botonEnviar.textContent = nodo.input.textoBoton || 'Confirmar';

  const avisoError = document.createElement('span');
  avisoError.className = 'texto-validacion';

  fila.appendChild(input);
  fila.appendChild(botonEnviar);
  formulario.appendChild(fila);
  formulario.appendChild(avisoError);

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const valor = input.value.trim();

    if (!validarDato(valor, nodo.input.validacion)) {
      avisoError.textContent = nodo.input.mensajeError;
      return;
    }

    avisoError.textContent = '';
    mostrarMensaje(valor, 'usuario');

    if (nodo.input.guardarComo === 'nombre') {
      memoriaUsuario.nombre = valor;
    } else {
      guardarEleccion(nodo, valor);
    }

    mostrarNodo(nodo.input.siguiente);
  });

  zonaDeMensaje.appendChild(formulario);
  input.focus();
}

// Valida formato de texto (sin números) o numérico
function validarDato(valor, tipo) {
  if (!valor) return false;
  if (tipo === 'textoSinNumeros') {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(valor);
  }
  if (tipo === 'numero') {
    return /^\d+$/.test(valor) && Number(valor) > 0;
  }
  return true;
}

// Guarda hasta las últimas 3 elecciones relevantes del usuario
function guardarEleccion(nodo, textoEleccion) {
  if (!nodo.recordar) return;
  memoriaUsuario.elecciones.push(textoEleccion);
  if (memoriaUsuario.elecciones.length > 3) {
    memoriaUsuario.elecciones.shift();
  }
}

// Sustituye marcadores en el texto usando la memoria de la sesión actual
function reemplazarVariables(texto) {
  const nombre = memoriaUsuario.nombre || 'hincha';
  const historial = memoriaUsuario.elecciones.length > 0
    ? memoriaUsuario.elecciones.join(' • ')
    : 'Todavía no registraste elecciones';

  return texto
    .replace(/\{nombre\}/g, nombre)
    .replace(/\{elecciones\}/g, historial);
}

// Agrega una burbuja de texto a la zona de chat
function mostrarMensaje(texto, claseTipo) {
  const burbuja = document.createElement('div');
  burbuja.className = `mensaje ${claseTipo}`;
  burbuja.textContent = texto;

  zonaDeChat.appendChild(burbuja);
  zonaDeChat.scrollTop = zonaDeChat.scrollHeight;
}
