"use client";

import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab
} from '@mui/material';
import { ChevronDown, Info } from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

const infoData = {
  garantia: {
    title: 'Garantía Devil',
    intro: 'Todos nuestros productos cuentan con la exclusiva Garantía Devil, diseñada para brindarte la máxima tranquilidad en cada compra. Sabemos lo importante que es tu setup, por eso nos comprometemos a ofrecerte el mejor respaldo post-venta del mercado.',
    items: [
      { id: 'g1', title: 'Plazos de Cobertura', content: 'Por defecto, todos los componentes principales (placas de video, procesadores, motherboards) cuentan con 12 meses de garantía directa. Los periféricos y accesorios varían entre 3 y 6 meses dependiendo del fabricante.' },
      { id: 'g2', title: '¿Qué cubre la garantía?', content: 'La garantía cubre exclusivamente defectos de fabricación y fallas internas del hardware que impidan el correcto funcionamiento del dispositivo bajo un uso normal.' },
      { id: 'g3', title: 'Exclusiones', content: 'No están cubiertos daños físicos (golpes, caídas, pines doblados), daños por humedad o líquidos, alteraciones de software no autorizadas (overclocking extremo), ni daños causados por variaciones de tensión eléctrica en el domicilio.' },
      { id: 'g4', title: '¿Cómo solicitar la garantía?', content: 'Comunicate inmediatamente con nosotros a través de nuestro número oficial de WhatsApp con tu número de pedido a mano. Evaluaremos el caso y te brindaremos los pasos a seguir para el recambio o reparación del artículo.' },
    ]
  },
  envios: {
    title: 'Política de Envíos',
    intro: 'Hacemos envíos rápidos y seguros a todo el país para que no tengas que esperar de más para empezar a jugar. Todos nuestros paquetes se embalan con extrema precaución utilizando materiales anti-estáticos y anti-golpes.',
    items: [
      { id: 'e1', title: 'Envíos Express (CABA y GBA)', content: 'Si realizás la compra y el pago antes de las 13:00hs, tu pedido se despacha y es entregado en el mismo día mediante nuestra flota de mensajería privada. Para pedidos luego de ese horario, la entrega se efectúa al siguiente día hábil.' },
      { id: 'e2', title: 'Envíos al Interior', content: 'Realizamos despachos a todo el país a través de Andreani y Correo Argentino. El tiempo estimado de llegada dependerá de la localidad, generalmente rondando los 3 a 7 días hábiles tras confirmar el pago.' },
      { id: 'e3', title: 'Seguimiento', content: 'Una vez despachado el producto, vas a recibir un código de seguimiento por correo electrónico (o WhatsApp, según prefieras) con el que vas a poder verificar la ubicación de tu compra en tiempo real desde la plataforma del correo asignado.' },
    ]
  },
  terminos: {
    title: 'Términos y Condiciones',
    intro: (
      <>
        Al utilizar y operar en nuestra plataforma (<span style={{ color: '#cc0000', fontWeight: 800 }}>Devil</span> <span style={{ color: '#1a1a1a', fontWeight: 800 }}>Gaming</span>), estás aceptando de forma plena los términos, condiciones y normativas estipulados en este documento.
      </>
    ),
    items: [
      { id: 't1', title: 'Propósito de la Plataforma', content: 'Nuestra web opera como un catálogo y gestor de pedidos informáticos de hardware electrónico orientado al mundo gamer y profesional. Los precios mostrados están sujetos a modificaciones sin previo aviso debido a disponibilidad de stock e importaciones.' },
      { id: 't2', title: 'Proceso de Reserva y Compra', content: 'El sistema de nuestra web no cobra al usuario de forma directa en el checkout. La web toma tu "Pedido" como una intención real de reserva. Una vez emitido el pedido, serás contactado a la brevedad por un asesor a través de WhatsApp para coordinar el pago y liquidar la transacción comercial definitiva.' },
      { id: 't3', title: 'Datos de Usuarios (Privacidad)', content: 'Utilizamos la información recopilada en la sección "Checkout" (nombre y WhatsApp) de forma estrictamente comercial y privada para poder completar el servicio estipulado. En ningún momento venderemos ni compartiremos tu información de contacto a terceros.' },
      { id: 't4', title: 'Disponibilidad de Stock', content: 'Mientras nuestro catálogo se actualiza constantemente para reflejar el stock disponible, debido a la dinámica de las importaciones, podría darse el caso donde un producto listado no se encuentre habilitado al momento del cobro. De ocurrir esto, no habrá penalizaciones económicas de ningún tipo al usuario.' },
    ]
  }
};

function InfoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as keyof typeof infoData;
  const currentTab = infoData[tabParam] ? tabParam : 'garantia';

  const currentData = infoData[currentTab];

  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setExpanded(false); // Resetear acordeón abierto al cambiar de tab
    router.push(`/info?tab=${newValue}`);
  };

  return (
    <Box sx={{ bgcolor: '#f4f4f4', minHeight: '100vh', pb: 10 }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', py: 2 }}>
        <Container maxWidth="xl">
          <Breadcrumbs separator="›" aria-label="breadcrumb">
            <Link component={NextLink} href="/" color="inherit" underline="hover">Inicio</Link>
            <Typography color="text.primary">Información Legal</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: 6 }}>
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              bgcolor: 'rgba(0,0,0,0.02)',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              '& .MuiTab-root': { py: 3, fontWeight: 700, fontSize: '1rem' }
            }}
          >
            <Tab value="garantia" label="Garantía" />
            <Tab value="envios" label="Envíos" />
            <Tab value="terminos" label="Términos y Condiciones" />
          </Tabs>

          <Box sx={{ p: { xs: 4, md: 6 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Info size={32} color="#cc0000" />
              <Typography variant="h3" sx={{ fontWeight: 800 }}>{currentData.title}</Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 5, lineHeight: 1.8, color: 'text.secondary' }}>
              {currentData.intro}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {currentData.items.map((item, index) => (
                <Accordion
                  key={item.id}
                  expanded={expanded === item.id}
                  onChange={handleAccordionChange(item.id)}
                  elevation={0}
                  sx={{
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px !important',
                    '&:before': { display: 'none' },
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={20} />}
                    sx={{
                      bgcolor: expanded === item.id ? 'rgba(204,0,0,0.03)' : 'white',
                      py: 1,
                      px: 3,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: expanded === item.id ? 'primary.main' : 'text.primary' }}>
                      {item.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, py: 3, bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                      {item.content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default function InfoPage() {
  return (
    <Suspense fallback={<Box sx={{ py: 20, textAlign: 'center' }}><Typography>Cargando información...</Typography></Box>}>
      <InfoContent />
    </Suspense>
  );
}
