const statusMessage = document.querySelector("#status-message");
const loginSection = document.querySelector("#login-section");
const catalogSection = document.querySelector("#catalog-section");
const loginForm = document.querySelector("#login-form");
const productList = document.querySelector("#product-list");
const addProductForm = document.querySelector("#add-product-form");
const config = window.supabaseConfig;
const imageBucket = "product-images";
const maxImageSize = 10 * 1024 * 1024;
const imageExtensions = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
};
let supabaseClient = null;

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.dataset.type = type;
}

function getWhatsAppUrl(form) {
    const values = new FormData(form);
    const whatsappUrl = values.get("whatsappUrl").trim();
    if (new URL(whatsappUrl).protocol !== "https:") {
        throw new Error("El enlace de WhatsApp debe usar HTTPS.");
    }

    return whatsappUrl;
}

function validateProductImage(form) {
    const values = new FormData(form);
    const hasUploadedFile = form.querySelector("input[name='imageFile']").files.length > 0;
    if (!values.get("image").trim() && !hasUploadedFile) {
        throw new Error("Indica una imagen o selecciona una foto para subir.");
    }
}

function getProductValues(form, uploadedImage) {
    const values = new FormData(form);
    const whatsappUrl = getWhatsAppUrl(form);
    const image = uploadedImage || values.get("image").trim();
    if (!image) {
        throw new Error("Indica una imagen o selecciona una foto para subir.");
    }

    return {
        image,
        name: values.get("name").trim(),
        description: values.get("description").trim(),
        price: values.get("price").trim(),
        whatsapp_url: whatsappUrl,
        tag: values.get("tag").trim() || null
    };
}

function createField(labelText, name, value, options = {}) {
    const label = document.createElement("label");
    label.textContent = labelText;

    const input = options.multiline
        ? document.createElement("textarea")
        : document.createElement("input");
    input.name = name;
    input.value = value || "";
    input.required = options.required !== false;
    if (options.multiline) {
        input.rows = 3;
    } else {
        input.type = options.type || "text";
    }

    label.append(input);
    if (options.wide) {
        label.classList.add("wide-field");
    }
    return label;
}

async function uploadProductImage(form) {
    getWhatsAppUrl(form);
    validateProductImage(form);
    const file = form.querySelector("input[name='imageFile']").files[0];
    if (!file) {
        return null;
    }
    if (!Object.prototype.hasOwnProperty.call(imageExtensions, file.type)) {
        throw new Error("El archivo debe ser una imagen JPG, PNG, WebP, GIF o AVIF.");
    }
    if (file.size > maxImageSize) {
        throw new Error("La imagen no puede superar los 10 MB.");
    }

    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${imageExtensions[file.type]}`;
    const { error } = await supabaseClient.storage
        .from(imageBucket)
        .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (error) {
        if (error.message === "Bucket not found") {
            throw new Error('No existe el almacenamiento "product-images". Ejecuta el supabase-setup.sql actualizado en SQL Editor de Supabase.');
        }
        throw error;
    }

    const { data } = supabaseClient.storage.from(imageBucket).getPublicUrl(path);
    return data.publicUrl;
}

function createProductForm(product) {
    const form = document.createElement("form");
    form.className = "product-entry";
    form.dataset.productId = product.id;

    const heading = document.createElement("h3");
    heading.textContent = product.name;
    const imageField = createField("Imagen actual (ruta del sitio o URL)", "image", product.image, { required: false });
    const imageUploadLabel = document.createElement("label");
    imageUploadLabel.textContent = "Subir foto nueva (opcional)";
    const imageUpload = document.createElement("input");
    imageUpload.type = "file";
    imageUpload.name = "imageFile";
    imageUpload.accept = Object.keys(imageExtensions).join(",");
    imageUploadLabel.append(imageUpload);
    form.append(
        heading,
        imageField,
        imageUploadLabel,
        createField("Nombre", "name", product.name),
        createField("Descripción", "description", product.description, { multiline: true, wide: true }),
        createField("Precio", "price", product.price),
        createField("Enlace de WhatsApp", "whatsappUrl", product.whatsapp_url, { type: "url" }),
        createField("Etiqueta (opcional)", "tag", product.tag, { required: false })
    );

    const actions = document.createElement("div");
    actions.className = "wide-field form-actions";

    const saveButton = document.createElement("button");
    saveButton.className = "primary-button";
    saveButton.type = "submit";
    saveButton.textContent = "Guardar cambios";

    const deleteButton = document.createElement("button");
    deleteButton.className = "primary-button delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.textContent = "Eliminar producto";

    actions.append(saveButton, deleteButton);
    form.append(actions);
    return form;
}

async function loadProducts() {
    if (!supabaseClient) {
        throw new Error("Supabase no está inicializado.");
    }

    showStatus("Cargando catálogo…");
    const { data, error } = await supabaseClient
        .from("products")
        .select("id, image, name, description, price, whatsapp_url, tag, sort_order")
        .order("sort_order", { ascending: true });

    if (error) {
        throw error;
    }

    productList.replaceChildren();
    if (data.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-list";
        emptyMessage.textContent = "Todavía no hay productos. Agrega el primero abajo.";
        productList.append(emptyMessage);
    } else {
        data.forEach((product) => productList.append(createProductForm(product)));
    }
    showStatus("");
}

function setAuthenticated(isAuthenticated) {
    loginSection.hidden = isAuthenticated;
    catalogSection.hidden = !isAuthenticated;
}

if (!config || !config.url || !config.anonKey) {
    showStatus("Falta configurar la URL y la clave pública de Supabase en supabase-config.js.", "error");
    loginForm.querySelector("button[type='submit']").disabled = true;
} else if (!window.supabase || typeof window.supabase.createClient !== "function") {
    showStatus("No se pudo cargar Supabase. Revisa tu conexión a internet e inténtalo de nuevo.", "error");
    loginForm.querySelector("button[type='submit']").disabled = true;
} else {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);

    async function openCatalog() {
        setAuthenticated(true);
        try {
            await loadProducts();
        } catch (error) {
            console.error(error);
            showStatus(`No se pudo cargar el catálogo. Verifica los permisos de administrador: ${error.message}`, "error");
        }
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = new FormData(loginForm);
        const submitButton = loginForm.querySelector("button[type='submit']");
        submitButton.disabled = true;
        showStatus("Validando acceso…");

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: values.get("email").trim(),
                password: values.get("password")
            });

            if (error) {
                showStatus(`No se pudo iniciar sesión: ${error.message}`, "error");
                return;
            }
            await openCatalog();
        } catch (error) {
            showStatus(`No se pudo iniciar sesión: ${error.message}`, "error");
        } finally {
            submitButton.disabled = false;
        }
    });

    document.querySelector("#logout-button").addEventListener("click", async () => {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                showStatus(`No se pudo cerrar sesión: ${error.message}`, "error");
                return;
            }
            setAuthenticated(false);
            showStatus("Sesión cerrada.", "success");
        } catch (error) {
            showStatus(`No se pudo cerrar sesión: ${error.message}`, "error");
        }
    });

    productList.addEventListener("submit", async (event) => {
        if (!(event.target instanceof HTMLFormElement)) {
            return;
        }
        event.preventDefault();
        const form = event.target;
        const saveButton = form.querySelector("button[type='submit']");
        saveButton.disabled = true;
        try {
            const uploadedImage = await uploadProductImage(form);
            const { error } = await supabaseClient
                .from("products")
                .update(getProductValues(form, uploadedImage))
                .eq("id", form.dataset.productId);

            if (error) {
                throw error;
            }
            showStatus("Producto actualizado.", "success");
            await loadProducts();
        } catch (error) {
            showStatus(`No se pudieron guardar los cambios: ${error.message}`, "error");
        } finally {
            saveButton.disabled = false;
        }
    });

    productList.addEventListener("click", async (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const button = event.target.closest("button[data-action='delete']");
        if (!button) {
            return;
        }

        const form = button.closest("form");
        const productName = form.querySelector("input[name='name']").value;
        if (!window.confirm(`¿Eliminar por completo "${productName}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        button.disabled = true;
        try {
            const { error } = await supabaseClient
                .from("products")
                .delete()
                .eq("id", form.dataset.productId);
            if (error) {
                throw error;
            }
            showStatus("Producto eliminado.", "success");
            await loadProducts();
        } catch (error) {
            button.disabled = false;
            showStatus(`No se pudo eliminar el producto: ${error.message}`, "error");
        }
    });

    addProductForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = addProductForm.querySelector("button[type='submit']");
        submitButton.disabled = true;

        try {
            const uploadedImage = await uploadProductImage(addProductForm);
            const { data, error: listError } = await supabaseClient
                .from("products")
                .select("sort_order")
                .order("sort_order", { ascending: false })
                .limit(1);
            if (listError) {
                throw listError;
            }

            const nextOrder = data.length ? data[0].sort_order + 1 : 0;
            const { error } = await supabaseClient
                .from("products")
                .insert({ ...getProductValues(addProductForm, uploadedImage), sort_order: nextOrder });
            if (error) {
                throw error;
            }

            addProductForm.reset();
            showStatus("Producto agregado.", "success");
            await loadProducts();
        } catch (error) {
            showStatus(`No se pudo agregar el producto: ${error.message}`, "error");
        } finally {
            submitButton.disabled = false;
        }
    });

    supabaseClient.auth.getSession()
        .then(({ data, error }) => {
            if (error) {
                showStatus(`No se pudo verificar la sesión: ${error.message}`, "error");
                return;
            }
            if (data.session) {
                openCatalog();
            }
        })
        .catch((error) => {
            showStatus(`No se pudo verificar la sesión: ${error.message}`, "error");
        });
}
