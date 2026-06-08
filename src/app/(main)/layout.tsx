import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import FloatingContact from "../../components/layout/FloatingContact";
import { Box } from "@mui/material";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        {children}
      </main>
      <FloatingContact />
      <Footer />
    </div>
  );
}

