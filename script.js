const productsGrid = document.querySelector("#products-grid");
const products = window.servicesData && window.servicesData.products;
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

if (!Array.isArray(products)) {
    throw new Error("No se encontró una lista válida de productos en services-data.js.");
}

function createProductCard(product) {
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
    orderButton.href = product.whatsappUrl;
    orderButton.className = "btn-ws";
    orderButton.target = "_blank";

    const whatsappIcon = document.createElement("i");
    whatsappIcon.className = "fa-brands fa-whatsapp";
    orderButton.append(whatsappIcon, document.createTextNode(" Pedir por WhatsApp"));

    info.append(name, price, description, orderButton);
    card.append(imageContainer, info);

    return card;
}

products.forEach((product) => {
    const requiredFields = ["image", "name", "description", "price", "whatsappUrl"];
    const missingField = requiredFields.find((field) => (
        typeof product[field] !== "string" || product[field].trim() === ""
    ));

    if (missingField) {
        throw new Error(`Falta el campo "${missingField}" en un producto de services-data.js.`);
    }

    productsGrid.append(createProductCard(product));
});
