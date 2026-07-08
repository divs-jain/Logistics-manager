export function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getRole() {
  return getUser()?.role ?? null;
}

export function getDefaultRoute(role) {
  switch (role) {
    case "CC":
      return "/dashboard";
    case "OC":
      return "/inventory";
    case "CATEGORY":
      return "/demands";
    default:
      return "/login";
  }
}
