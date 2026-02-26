import Home from './pages/Home';
import MantenimientoPreventivo from './pages/MantenimientoPreventivo';
import MantenimientoCorrectivo from './pages/MantenimientoCorrectivo';
import Diagnosticos from './pages/Diagnosticos';
import ContratosUptime from './pages/ContratosUptime';
import SuministroRefacciones from './pages/SuministroRefacciones';
import ClientLogin from './pages/ClientLogin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import __Layout from './pages/Layout.jsx';


export const PAGES = {
    "Home": Home,
    "MantenimientoPreventivo": MantenimientoPreventivo,
    "MantenimientoCorrectivo": MantenimientoCorrectivo,
    "Diagnosticos": Diagnosticos,
    "ContratosUptime": ContratosUptime,
    "SuministroRefacciones": SuministroRefacciones,
}

// Páginas que no usan el Layout público (sin header/footer)
export const STANDALONE_PAGES = {
    "ClientLogin": ClientLogin,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    standalonePages: STANDALONE_PAGES,
    Layout: __Layout,
};