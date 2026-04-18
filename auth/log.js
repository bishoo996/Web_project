console.log("Login system loaded");
function validateLogin(email, password) {
    if (!email || !password) {
        console.log("Missing fields");
        return false;
    }
    console.log("Logging in with:", email);
    return true;
}

function validateSignup(data) {
    if (!data.email || !data.password) {
        console.log("Missing signup fields");
        return false;
    }
    console.log("Creating account for:", data.email);
    return true;
}