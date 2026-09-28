export const content = {
  intro: {
    title: 'Para mi gran amor',
    question: '¿Deseas iniciar esta etapa conmigo?',
    yes: 'Sí 💜',
    no: 'No',
    noTeases: ['¿Segura? 😏', 'Piénsalo mejor…'],
  },

  sad: {
    line1: 'Mi corazón se hizo chiquito… 💔',
    line2: 'Pero yo no me rindo tan fácil.',
    back: 'Está bien, déjame intentarlo otra vez 💜',
  },

  loading: {
    messages: [
      'Preparando algo para ti…',
      'Alineando las estrellas…',
      'Recogiendo recuerdos…',
      'Casi listo, mi amor…',
    ],
  },

  galaxyPhrases: [
    'Te amo',
    'Gracias por todo',
    'Me haces muy feliz',
    'Eres mi lugar seguro',
    'Contigo todo es mejor',
    'Mi persona favorita',
    'Gracias por elegirme cada día',
    'Valery 💜',
    'Eres mi hogar',
    'Contigo hasta el infinito',
  ],
  galaxyEnter: 'Ingresar',

  lock: {
    title: 'Si tanto me conoces, digita mi fecha de nacimiento',
    submit: 'Comprobar',
    answer: { day: 5, month: 2, year: 2002 },
    wrong: [
      'Mmm… ¿segura? 😏',
      'Piénsalo bien, tú me lo celebraste 🎂',
      'Casi, casi… pero no 💜',
      'Una más y te doy una pista…',
    ],
    hint: 'Pista: es en febrero, y nací en el 2002 🎈',
  },

  book: {
    coverTitle: 'Nuestra historia',
    coverSubtitle: 'Valery & Andrés',
    coverHint: 'Ábreme despacio 💜',
    prev: '‹ Anterior',
    next: 'Siguiente ›',
    lockedNext: 'Arma el rompecabezas para continuar 💜',
    lastPageText: 'Hay algo más que quiero mostrarte…',
    lastPageButton: 'Ver el final',
    backCover: 'Continuará…',
  },

  // Orden del libro: 01, 03, 04, 05, [rompecabezas = cascada], 06, 07, 08, 09, 10.
  // La cascada NO va aquí: es la foto del rompecabezas (content.puzzle).
  pages: [
    {
      photo: 'assets/img/photo-01.webp', tiny: 'assets/img/photo-01-tiny.webp',
      date: '13 de junio',
      quote: 'Si te quiero es porque eres mi amor, mi cómplice y todo; y en la calle codo a codo somos mucho más que dos.',
      author: 'Mario Benedetti',
      line: 'Tú, Kenji y yo caminando juntos. Ese día entendí que hogar no es un lugar: es hacia donde vamos los tres.',
    },
    {
      photo: 'assets/img/photo-03.webp', tiny: 'assets/img/photo-03-tiny.webp',
      date: '4 de abril',
      quote: 'Te quiero a las diez de la mañana, y a las once, y a las doce del día.',
      author: 'Jaime Sabines',
      line: 'Un cielo así de azul y tú riéndote: no necesito más pruebas de que el universo está de nuestro lado.',
    },
    {
      photo: 'assets/img/photo-04.webp', tiny: 'assets/img/photo-04-tiny.webp',
      date: '4 de abril',
      quote: 'Amar no es mirarse el uno al otro, es mirar juntos en la misma dirección.',
      author: 'Antoine de Saint-Exupéry',
      line: 'Tú sentada con las montañas detrás, y yo con la cámara. Ese día el paisaje no fue lo más bonito de la foto.',
    },
    {
      photo: 'assets/img/photo-05.webp', tiny: 'assets/img/photo-05-tiny.webp',
      date: '4 de abril',
      quote: 'Pies, ¿para qué los quiero, si tengo alas para volar?',
      author: 'Frida Kahlo',
      line: 'Esas alas ya eran tuyas antes de la foto. Gracias por enseñarme a volar contigo.',
    },
    {
      photo: 'assets/img/photo-06.webp', tiny: 'assets/img/photo-06-tiny.webp',
      date: '3 de abril',
      quote: 'Duda que las estrellas sean fuego, duda que el sol se mueva, duda que la verdad sea mentira; pero nunca dudes de mi amor.',
      author: 'William Shakespeare',
      line: 'Hasta la luna salió a vernos esa noche. Y yo, con tanta luz, solo te veía a ti.',
    },
    {
      photo: 'assets/img/photo-07.webp', tiny: 'assets/img/photo-07-tiny.webp',
      date: '3 de abril',
      quote: 'Andábamos sin buscarnos, pero sabiendo que andábamos para encontrarnos.',
      author: 'Julio Cortázar',
      line: 'Una tarde cualquiera bajo un techo cualquiera, y aun así todo me parecía extraordinario porque estabas.',
    },
    {
      photo: 'assets/img/photo-08.webp', tiny: 'assets/img/photo-08-tiny.webp',
      date: '3 de abril',
      quote: '¿Qué es poesía?, dices mientras clavas en mi pupila tu pupila. ¿Qué es poesía? ¿Y tú me lo preguntas? Poesía… eres tú.',
      author: 'Gustavo Adolfo Bécquer',
      line: 'Calles blancas, cielo gris, y tu sonrisa poniéndole color a todo.',
    },
    {
      photo: 'assets/img/photo-09.webp', tiny: 'assets/img/photo-09-tiny.webp',
      date: '7 de marzo',
      quote: 'Los amantes no se encuentran en algún lugar. Están el uno en el otro desde siempre.',
      author: 'Rumi',
      line: 'De nuestras primeras fotos juntos. Aquí ya lo sabía, me hacías tan feliz.',
    },
    {
      photo: 'assets/img/photo-10.webp', tiny: 'assets/img/photo-10-tiny.webp',
      date: '13 de junio',
      quote: 'Solo se ve bien con el corazón; lo esencial es invisible a los ojos.',
      author: 'Antoine de Saint-Exupéry',
      line: 'Tú y Kenji mirando hacia arriba, y yo detrás de la cámara, seguro de una cosa: quiero cuidarlos a los dos toda la vida.',
    },
  ],

  puzzle: {
    image: 'assets/img/puzzle.webp',
    title: 'Este recuerdo está en piezas. Ármalo conmigo.',
    instructions: 'Toca una ficha y luego toca otra para intercambiarlas.',
    help: 'Pídeme ayuda 💜',
    helpAfterMs: 90000,
    moves: 'Movimientos',
    date: '17 de mayo',
    quote: 'Te amo sin saber cómo, ni cuándo, ni de dónde; te amo directamente, sin problemas ni orgullo.',
    author: 'Pablo Neruda',
    line: 'Frente a toda esa agua cayendo, lo único que miraba eras tú. Así se arma un amor: pieza por pieza, con paciencia, hasta que todo encaja.',
  },

  volcano: {
    warning: 'Algo está por pasar…',
    finalText: 'Te amo con mi alma',
    next: 'Una última cosa…',
  },

  letter: {
    greeting: 'Valery,',
    paragraphs: [
      'Gracias por cada foto de este libro y por todas las que todavía no hemos tomado.',
      'Quiero despertar contigo, pelear por la cobija, aprender tus manías y que tú aprendas las mías. Quiero que "mi casa" pase a ser "nuestra casa", y que Kenji crezca sabiendo que tiene a alguien más que lo quiere y lo cuida.',
      'No te prometo que todo será perfecto. Te prometo que en cada día imperfecto vas a tenerme a tu lado, eligiéndote otra vez.',
      'Empecemos esta etapa juntos.',
    ],
    signature: 'Andrés',
    date: '27 de septiembre de 2026',
    restart: 'Volver a vivirlo 💜',
  },
};
