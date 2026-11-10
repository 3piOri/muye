const productsGrid = document.querySelector("#products-grid");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

if (menuToggle && navLinks) {
    const closeMenu = () => {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
        navLinks.classList.remove("is-open");
    };

    menuToggle.addEventListener("click", () => {
        const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isExpanded));
        menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
        navLinks.classList.toggle("is-open", !isExpanded);
    });

    navLinks.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
            menuToggle.focus();
        }
    });
}

if (!productsGrid) {
    throw new Error('No se encontró el contenedor "#products-grid".');
}

function createProductCard(product) {
    const orderUrl = new URL(product.whatsappUrl, window.location.href);
    if (orderUrl.protocol !== "https:") {
        throw new Error(`El enlace para pedir "${product.name}" debe usar HTTPS.`);
    }

    const card = document.createElement("div");
    card.className = "product-card";

    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    imageContainer.append(image);

    if (product.tag) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = product.tag;
        imageContainer.append(tag);
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = product.price;

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = product.description;

    const orderButton = document.createElement("a");
    orderButton.href = orderUrl.href;
    orderButton.className = "btn-ws";
    orderButton.target = "_blank";
    orderButton.rel = "noopener noreferrer";

    const whatsappIcon = document.createElement("i");
    whatsappIcon.className = "fa-brands fa-whatsapp";
    orderButton.append(whatsappIcon, document.createTextNode(" Pedir por WhatsApp"));

    info.append(name, price, description, orderButton);
    card.append(imageContainer, info);

    return card;
}

function renderProducts(products) {
    productsGrid.replaceChildren();

    if (products.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "catalog-empty";
        emptyMessage.textContent = "Estamos preparando nuevos productos.";
        productsGrid.append(emptyMessage);
        return;
    }

    products.forEach((product) => {
        const requiredFields = ["image", "name", "description", "price", "whatsappUrl"];
        const missingField = requiredFields.find((field) => (
            typeof product[field] !== "string" || product[field].trim() === ""
        ));

        if (missingField) {
            throw new Error(`Falta el campo "${missingField}" en un producto del catálogo.`);
        }

        productsGrid.append(createProductCard(product));
    });
}

function showCatalogError(message) {
    const error = document.createElement("p");
    error.className = "catalog-error";
    error.setAttribute("role", "alert");
    error.textContent = message;
    productsGrid.replaceChildren(error);
}

async function loadProducts() {
    const config = window.supabaseConfig;
    const hasSupabaseConfig = config && config.url && config.anonKey;

    if (!hasSupabaseConfig) {
        const products = window.servicesData && window.servicesData.products;
        if (!Array.isArray(products)) {
            throw new Error("No se encontró una lista válida de productos en services-data.js.");
        }
        renderProducts(products);
        return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        throw new Error("No se pudo cargar Supabase. Revisa tu conexión a internet e inténtalo de nuevo.");
    }

    const client = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await client
        .from("products")
        .select("image, name, description, price, whatsapp_url, tag")
        .order("sort_order", { ascending: true });

    if (error) {
        throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
    }

    renderProducts(data.map((product) => ({
        ...product,
        whatsappUrl: product.whatsapp_url
    })));
}

loadProducts().catch((error) => {
    console.error(error);
    showCatalogError("No pudimos cargar el catálogo en este momento. Intenta de nuevo más tarde.");
});
