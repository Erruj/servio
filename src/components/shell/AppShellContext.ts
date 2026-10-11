import { createContext, useContext } from 'react';

/** True binnen de gedeelde app-shell; pagina's renderen dan geen eigen balk/sidebar meer. */
export const AppShellContext = createContext(false);
export const useInAppShell = () => useContext(AppShellContext);
