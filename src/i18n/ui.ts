export const messages = {
  es: {
    title: 'Aprende cerca de casa',
    description:
      'Cursos y talleres presenciales de organizaciones de Barcelona. Información de fuentes oficiales, con enlaces para consultar los detalles.',
    skip: 'Saltar al contenido',
    mission: 'Aprendizaje local, abierto a todo el mundo.',
    search: 'Buscar por título',
    price: 'Precio máximo (€)',
    submit: 'Buscar cursos',
    clear: 'Limpiar filtros',
    results: 'Cursos y talleres',
    empty: 'Todavía no hay cursos que coincidan con tu búsqueda.',
    emptyHelp:
      'Estamos preparando el directorio con información de fuentes oficiales. Puedes consultar la programación del centro.',
    source: 'Consultar fuente oficial',
    sourceName: 'Programación del Centre Cívic Sant Andreu',
    unknownPrice: 'Precio por confirmar',
    unknownDates: 'Fechas por confirmar',
    verified: 'Consultado el',
    notice:
      'Las plazas y las condiciones pueden cambiar. Confirma siempre los detalles con la entidad organizadora.',
    previous: 'Anterior',
    next: 'Siguiente',
    pagination: 'Páginas de resultados',
    invalid:
      'Revisa los filtros: búsqueda de hasta 40 bytes, precio entre 0 y 9999,99 y página entre 1 y 1000.',
    unavailable:
      'El directorio no está disponible temporalmente. Vuelve a intentarlo más tarde.',
    language: 'Idioma',
    pageTitle: 'LearnAprop · Cursos y talleres en Barcelona',
    footer:
      'Un proyecto gratuito y de código abierto para descubrir oportunidades de aprendizaje en la comunidad.',
  },
  ca: {
    title: 'Aprèn a prop de casa',
    description:
      'Cursos i tallers presencials d’organitzacions de Barcelona. Informació de fonts oficials, amb enllaços per consultar-ne els detalls.',
    skip: 'Salta al contingut',
    mission: 'Aprenentatge local, obert a tothom.',
    search: 'Cerca per títol',
    price: 'Preu màxim (€)',
    submit: 'Cerca cursos',
    clear: 'Neteja els filtres',
    results: 'Cursos i tallers',
    empty: 'Encara no hi ha cursos que coincideixin amb la teva cerca.',
    emptyHelp:
      'Estem preparant el directori amb informació de fonts oficials. Pots consultar la programació del centre.',
    source: 'Consulta la font oficial',
    sourceName: 'Programació del Centre Cívic Sant Andreu',
    unknownPrice: 'Preu per confirmar',
    unknownDates: 'Dates per confirmar',
    verified: 'Consultat el',
    notice:
      'Les places i les condicions poden canviar. Confirma sempre els detalls amb l’entitat organitzadora.',
    previous: 'Anterior',
    next: 'Següent',
    pagination: 'Pàgines de resultats',
    invalid:
      'Revisa els filtres: cerca de fins a 40 bytes, preu entre 0 i 9999,99 i pàgina entre 1 i 1000.',
    unavailable:
      'El directori no està disponible temporalment. Torna-ho a provar més tard.',
    language: 'Idioma',
    pageTitle: 'LearnAprop · Cursos i tallers a Barcelona',
    footer:
      'Un projecte gratuït i de codi obert per descobrir oportunitats d’aprenentatge a la comunitat.',
  },
} as const;

export type Locale = keyof typeof messages;

export function formatLocalDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}
