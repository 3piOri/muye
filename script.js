const productsGrid = document.querySelector("#products-grid");
const products = window.servicesData && window.servicesData.products;
const whatsappUrls = [
    "https://wa.me/5212345678?text=Hola!%20Me%20interesa%20comprar%20el%20Hoodie%20Oversize%20Muyë%20Vision",
    "https://wa.me/5212345678?text=Hola!%20Me%20interesa%20comprar%20la%20Playera%20Sakura%20Cyber",
    "https://wa.me/5212345678?text=Hola!%20Me%20interesa%20comprar%20la%20Gorra%20Mu%20Embroidered",
    "https://wa.me/5212345678?text=Hola!%20Me%20interesa%20comprar%20la%20kakera%20Canvas"
];

if (!productsGrid) {
    throw new Error('No se encontró el contenedor "#products-grid".');
}

if (!Array.isArray(products)) {
    throw new Error("No se encontró una lista válida de productos en services-data.js.");
}

function createProductCard(product, whatsappUrl) {
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
    orderButton.href = whatsappUrl;
    orderButton.className = "btn-ws";
    orderButton.target = "_blank";

    const whatsappIcon = document.createElement("i");
    whatsappIcon.className = "fa-brands fa-whatsapp";
    orderButton.append(whatsappIcon, document.createTextNode(" Pedir por WhatsApp"));

    info.append(name, price, description, orderButton);
    card.append(imageContainer, info);

    return card;
}

products.forEach((product, index) => {
    const requiredFields = ["image", "name", "description", "price"];
    const missingField = requiredFields.find((field) => (
        typeof product[field] !== "string" || product[field].trim() === ""
    ));

    if (missingField) {
        throw new Error(`Falta el campo "${missingField}" en un producto de services-data.js.`);
    }

    const whatsappUrl = whatsappUrls[index];

    if (!whatsappUrl) {
        throw new Error(`Falta el enlace de WhatsApp para el producto ${index + 1} en script.js.`);
    }

    productsGrid.append(createProductCard(product, whatsappUrl));
});
