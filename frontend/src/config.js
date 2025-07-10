function getConfig(name, defaultValue = null) {
    return window._env_?.[name] || defaultValue;
}

export function getBackendUrl() {
    return getConfig('BACKEND_URL');
}

export function getHoursCloseTicketsAuto() {
    return getConfig('REACT_APP_HOURS_CLOSE_TICKETS_AUTO');
}