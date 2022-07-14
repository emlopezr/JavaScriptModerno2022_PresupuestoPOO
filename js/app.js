// CLASES

class Presupuesto {
    constructor(total, restante, gastos) {
        this.total = Number(total);
        this.restante = Number(restante);
        this.gastos = gastos || [];
    }

    nuevoGasto(gasto) {
        this.gastos = [...this.gastos, gasto];
        this.calcularRestante();
    }

    calcularRestante() {
        const gastado = this.gastos.reduce((total, gasto) => total + gasto.cantidad, 0);
        this.restante = this.total - gastado;
    }

    eliminarGasto(id) {
        // Quitar el gasto de la lista y actualizar los datos
        this.gastos = this.gastos.filter(gasto => gasto.id !== id);
        this.calcularRestante();

        // Actualizar datos en pantalla
        ui.imprimirGastos(this.gastos);
        ui.actualizarRestante(this.restante);
        ui.comprobarPresupuesto(this);

        // Actualizar el registro del LocalStorage
        localStorage.setItem('presupuesto', JSON.stringify(this));
    }
}

class UI {
    insertarPresupuesto(presupuesto) {
        // Destructuring al objeto presupuesto
        const { total, restante } = presupuesto;

        // Insertar en el HTML
        document.querySelector('#total').textContent = total;
        document.querySelector('#restante').textContent = restante;
    }

    mostrarAlerta(mensaje, tipo, tiempo) {
        // Crear el elemento HTML
        const div = document.createElement('DIV');
        div.classList.add('text-center', 'alert');
        div.textContent = mensaje;

        // Tipos de alertas
        if (tipo === 'error') {
            div.classList.add('alert-danger');
        } else {
            div.classList.add('alert-success');
        }

        // Insertar en el HTML
        document.querySelector('.primario').insertBefore(div, formulario);

        // Quitar mensaje luego de cierto tiempo
        setTimeout(() => div.remove(), tiempo * 1000);
    }

    imprimirGastos(gastos) {
        // Limpiar el HTML previo
        while (listadoGastos.firstChild) {
            listadoGastos.removeChild(listadoGastos.firstChild);
        }

        // Iterar sobre los gastos
        gastos.forEach(gasto => {
            // Destructuring al gasto
            const { id, nombre, cantidad } = gasto;

            // Crear elemento HTML
            const li = document.createElement('LI');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.dataset.id = id; // Lo mismo que poner li.setAttribute('data-id', id);
            li.innerHTML = `${nombre} <span class="badge badge-primary badge-pill">$${cantidad}</span>`;

            // Botón para borrar el gasto
            const btnBorrar = document.createElement('BUTTON');
            btnBorrar.classList.add('btn', 'btn-danger', 'borrar-gasto');
            btnBorrar.innerHTML = 'Borrar &times'

            // Funcionalidad de borrar
            btnBorrar.onclick = () => presupuesto.eliminarGasto(id);

            // Insertarlo en la lista
            li.appendChild(btnBorrar)
            listadoGastos.appendChild(li);
        });
    }

    actualizarRestante(restante) {
        document.querySelector('#restante').textContent = restante;
    }

    comprobarPresupuesto(presupuestoObj) {
        // Destructuring del objeto
        const { total, restante } = presupuestoObj;

        // Selector a cambiar de color
        const restanteDiv = document.querySelector('.restante');

        /* Si se ha gastado más del 75%, se pone de color rojo
           Si se hja gastado más de la mitad, se pone de color amarillo */
        if (restante < (total * 0.25)) {
            restanteDiv.classList.remove('alert-success', 'alert-warning');
            restanteDiv.classList.add('alert-danger');
        } else if (restante < (total * 0.5)) {
            restanteDiv.classList.remove('alert-success', 'alert-danger');
            restanteDiv.classList.add('alert-warning');
        } else {
            restanteDiv.classList.remove('alert-warning', 'alert-danger');
            restanteDiv.classList.add('alert-success');
        }

        // Si el total es menor que cero, se muestra una alerta y se bloquea el botón
        if (restante <= 0) {
            ui.mostrarAlerta('El presupuesto se ha agotado', 'error', 5);
            formulario.querySelector('button[type="submit"]').disabled = true;
        }
    }
}

// VARIABLES Y SELECTORES E INSTANCIAS

const formulario = document.querySelector('#agregar-gasto');
const listadoGastos = document.querySelector('#gastos ul');
const btnReset = document.querySelector('#reset-app');
const ui = new UI();
let presupuesto;

// EVENTOS

eventListeners();
function eventListeners() {
    // Preguntar el presupuesto al usuario, validarlo y guardarlo
    document.addEventListener('DOMContentLoaded', preguntarPresupuesto)

    // Agregar gasto, pero antes validar el formulario
    formulario.addEventListener('submit', agregarGasto)

    // Reinicar el presupuesto -> Borrar todos los datos
    btnReset.addEventListener('click', borrarDatos);
}

// FUNCIONES

function preguntarPresupuesto() {
    // Buscar presupuesto en LocalStorage
    if (localStorage.getItem('presupuesto')) {
        // Sacar los datos del LocalStorage
        const presupuestoLS = JSON.parse(localStorage.getItem('presupuesto'));
        const { total, restante, gastos } = presupuestoLS;

        // Instanciar el objeto con los datos guardados y mostrar los datos en pantalla
        presupuesto = new Presupuesto(total, restante, gastos);
        ui.insertarPresupuesto(presupuesto);
        ui.imprimirGastos(gastos);
        return;
    }

    // Preguntar al usuario y validar presupuesto (Si no está en LocalStorage)
    let presupuestoUsuario = prompt('¿Cuál es tu presupuesto?');

    while (presupuestoUsuario === '' || presupuestoUsuario === null || isNaN(presupuestoUsuario) || presupuestoUsuario <= 0) {
        presupuestoUsuario = prompt('Por favor, ingrese un presupuesto válido');
    }

    // Instanciar presupuesto, guardarlo en LocalStorage y mostrarlo en pantalla
    presupuesto = new Presupuesto(presupuestoUsuario, presupuestoUsuario);
    localStorage.setItem('presupuesto', JSON.stringify(presupuesto));
    ui.insertarPresupuesto(presupuesto);
}

function agregarGasto(e) {
    e.preventDefault(); // Prevenir acción predeterminada

    // Leer campos del formulario
    const nombre = document.querySelector('#gasto').value;
    const cantidad = Number(document.querySelector('#cantidad').value);

    // Validar campos del formulario
    if (nombre === '' || cantidad === '') {
        // Algún campo vacío
        ui.mostrarAlerta('Todos los campos son obligatorios', 'error', 2);
        return;
    } else if (cantidad <= 0 || isNaN(cantidad)) {
        // Cantidad no válida
        ui.mostrarAlerta('Cantidad no válida', 'error', 2);
        return;
    }

    // Generar objeto con el gasto -> ID único
    const gasto = { id: Date.now(), nombre, cantidad } // Object Literal Enhancement
    presupuesto.nuevoGasto(gasto);

    // Imprimir alerta de "Correcto" y reiniciar formulario
    ui.mostrarAlerta('Gasto añadido correactamente', 'correcto', 2);
    formulario.reset();

    // Imprimir la lista de los gastos
    const { gastos, restante } = presupuesto;
    ui.imprimirGastos(gastos);
    ui.actualizarRestante(restante);

    // Cambio de color dependiendo del presupuesto restante
    ui.comprobarPresupuesto(presupuesto);

    // Actualizar el presupuesto del LocalStorage
    localStorage.setItem('presupuesto', JSON.stringify(presupuesto));
}

function borrarDatos() {
    // Borrar los datos del LocalStorage y recargar la página
    localStorage.removeItem('presupuesto');
    window.location.reload();
}