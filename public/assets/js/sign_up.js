const phoneInput = document.getElementById("phoneNumber");

phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 11) {
        value = value.slice(0, 11);
    }

    e.target.value = value;
});

phoneInput.addEventListener("keydown", (e) => {
    const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];

    if (allowedKeys.includes(e.key)) return;

    if (phoneInput.value.length >= 11) {
        e.preventDefault();
    }
});