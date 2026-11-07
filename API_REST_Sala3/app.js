// Configuración del proxy local de XAMPP
const API_BASE_URL = "http://localhost/API_REST_Sala3/proxy.php?endpoint=";

function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKey').value.trim();
    if (!apiKeyInput) {
        alert('Por favor, ingresa una API Key válida.');
        return;
    }
    localStorage.setItem('aula_api_key', apiKeyInput);
    alert('¡API Key guardada exitosamente!');
}

function getApiKey() {
    return localStorage.getItem('aula_api_key') || '';
}

async function apiRequest(endpoint, method = "GET", data = null) {
    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Falta configurar la API Key en la parte superior.");
        return { error: true, message: "API Key no configurada" };
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

    const headers = {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
    };

    const options = { method, headers };
    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(API_BASE_URL + cleanEndpoint, options);
        
        const contentType = response.headers.get("content-type");
        let result;
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            throw new Error(`El servidor no devolvió JSON (Código HTTP: ${response.status}).`);
        }
        
        if (!response.ok) {
            // Capturar detalles específicos de validación (como el error 422)
            let errorMessage = result.message || "Error en la petición HTTP";
            if (result.errors) {
                errorMessage += " -> " + JSON.stringify(result.errors);
            }
            throw new Error(errorMessage);
        }
        return result;
    } catch (error) {
        console.error("Error en la petición:", error);
        alert("Ocurrió un error: " + error.message);
        return { error: true, message: error.message };
    }
}

// --- FUNCIONES DE LA VISTA ---

async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<p class="text-muted">Cargando productos...</p>';

    const response = await apiRequest('products.php', 'GET');

    if (response.error) {
        container.innerHTML = '<p class="text-danger">No se pudieron cargar los productos.</p>';
        return;
    }

    const products = Array.isArray(response) ? response : (response.data || []);

    if (products.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay productos disponibles.</p>';
        return;
    }

    let html = '';
    products.forEach(product => {
        html += `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${product.name || product.nombre}</h6>
                    <small class="text-muted">ID: ${product.id} | Stock: ${product.stock ?? 'N/D'}</small>
                </div>
                <span class="badge bg-primary rounded-pill">$${product.price || product.precio}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

async function handleCreateOrder(event) {
    event.preventDefault();

    const productId = document.getElementById('productId').value;
    const quantity = document.getElementById('quantity').value;
    const customerName = document.getElementById('customerName').value.trim();

    // Estructura exacta que exige el servidor con el arreglo 'items' y el nombre del cliente
    const orderData = {
        customer_name: customerName,
        items: [
            {
                product_id: parseInt(productId),
                quantity: parseInt(quantity)
            }
        ]
    };

    const result = await apiRequest('orders.php', 'POST', orderData);

    if (!result.error) {
        alert('¡Pedido creado con éxito!');
        document.getElementById('order-form').reset();
        loadOrders(); // Actualizar la lista de pedidos automáticamente
    }
}

async function loadOrders() {
    const container = document.getElementById('orders-container');
    container.innerHTML = '<p class="text-muted small">Cargando pedidos...</p>';

    const response = await apiRequest('orders.php', 'GET');

    if (response.error) {
        container.innerHTML = '<p class="text-danger small">Error al cargar los pedidos.</p>';
        return;
    }

    const orders = Array.isArray(response) ? response : (response.data || []);

    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted small">Sin pedidos registrados.</p>';
        return;
    }

    let html = '<ul class="list-group list-group-flush">';
    orders.forEach(order => {
        // Obtenemos los datos del producto ya sea desde el arreglo 'items' o directamente
        let prodId = 'N/D';
        let cant = 'N/D';

        if (order.items && order.items.length > 0) {
            prodId = order.items[0].product_id || order.items[0].producto_id || 'N/D';
            cant = order.items[0].quantity || order.items[0].cantidad || 'N/D';
        } else {
            prodId = order.product_id || order.producto_id || 'N/D';
            cant = order.quantity || order.cantidad || 'N/D';
        }

        html += `
            <li class="list-group-item px-0 py-2">
                <div class="d-flex justify-content-between">
                    <span>Pedido #${order.id} (Prod: ${prodId})</span>
                    <span class="badge bg-secondary">Cant: ${cant}</span>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;
}