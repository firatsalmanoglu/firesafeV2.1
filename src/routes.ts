/**
 * * An array of routes that are accessible to the public
 * * These routes do not require authentication
 * * @type {string[]}
 */

export const publicRoutes = [
    "/",
    "/landpage/about",
    "/landpage/analytics",
    "/landpage/consultancy",
    "/landpage/education",
    "/landpage/services",

    
];

/**
 * * An array of routes that are used for authentication
 * * These routes will redirect logged in users to /settings
 * * @type {string[]}
 */

export const authRoutes = [
    "/login",
    "/register",
    "/error",
    "/verify",
    "/logout",
    
];


/**
 * * The prefix for authentication routes
 * * for API authentication purposes
 * * @type {string}
 */

export const apiAuthPrefix = "/api/auth";


/**
 * * The default redirect after loggedin
 * * @type {string}
 */
export const DEFAULT_GUEST_REDIRECT = "/customer";
