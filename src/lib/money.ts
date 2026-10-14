const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/**
 * Monto en pesos para mostrar en el panel de admin: sin decimales y con separador de miles
 * es-AR ("$7.127.400", "-$1.428.400").
 *
 * Solo da formato: redondea lo que se muestra, los cálculos siguen usando el valor completo.
 * Se redondea antes de poner el signo para que montos como -0,4 no se vean como "-$0".
 */
export const formatMoney = (value: number | string | null | undefined) => {
  const amount = Math.round(Number(value)) || 0;
  return amount < 0 ? `-$${pesos.format(-amount)}` : `$${pesos.format(amount)}`;
};
