import { ReactNode } from "react";

// Placeholder AuthGate until Supabase is connected.
// Once Supabase integration is enabled, we'll enforce route protection here.
const AuthGate = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export default AuthGate;
