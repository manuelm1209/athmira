import { Body, Heading, colors, spacing, typography } from "@athmira/ui";
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { SeoHead } from "@/components/SeoHead";
import { useLanguage } from "@/providers/LanguageProvider";

type LegalRoute = "privacy" | "terms";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocument = {
  description: string;
  effectiveDate: string;
  intro: string[];
  sections: LegalSection[];
  title: string;
};

const CONTACT_EMAIL = "admin@athmira.com";
const EFFECTIVE_DATE_EN = "May 21, 2026";
const EFFECTIVE_DATE_ES = "21 de mayo de 2026";

const legalDocuments: Record<LegalRoute, { en: LegalDocument; es: LegalDocument }> = {
  privacy: {
    en: {
      description:
        "Privacy Policy for athmira, including data collection, use, sharing, retention, security, and user rights.",
      effectiveDate: EFFECTIVE_DATE_EN,
      title: "Privacy Policy",
      intro: [
        "This Privacy Policy explains how athmira collects, uses, stores, shares, and protects personal information when you use athmira.com and the athmira application.",
        "athmira is built for endurance athletes and may process fitness, bike setup, camera, analysis, nutrition, and account data. We treat this information as sensitive athlete data even when a specific privacy law does not classify every field as sensitive."
      ],
      sections: [
        {
          title: "Who we are and how to contact us",
          paragraphs: [
            `athmira is the controller or business responsible for the personal information processed through the service, unless a separate agreement says otherwise. You can contact us at ${CONTACT_EMAIL} for privacy questions, security concerns, or rights requests.`,
            "If athmira appoints a data protection officer, representative, or dedicated privacy contact later, we will update this policy with those details."
          ]
        },
        {
          title: "Information we collect",
          bullets: [
            "Account information, such as name, email address, authentication identifiers, password credentials managed by our authentication provider, preferred language, and newsletter preference.",
            "Profile and athlete context, such as date of birth, gender, height, weight, and other information you choose to provide so the product can personalize guidance.",
            "Bike and equipment data, including bike type, brand, model, size, saddle height, saddle setback, stem length, crank length, handlebar width, tire setup, tire width, pressure plans, and related notes.",
            "Camera and analysis data, including camera permissions, local preview activity, snapshots or media you choose to capture or upload, fit sessions, joint angle estimates, posture estimates, aero scores, confidence scores, recommendations, and analysis history.",
            "Nutrition and planning data, including ride duration, intensity, carbohydrate, fluid, sodium, product selections, and saved plans.",
            "Device, usage, and security data, including IP address, device/browser type, operating system, app version, log data, error reports, approximate region, and events needed to secure and operate the service.",
            "Communications, including support messages, admin communications, security reports, and marketing preferences.",
            "Future integration data, if you connect a wearable or third-party service, such as Garmin, Strava, Apple Health, Google Fit, Wahoo, or TrainingPeaks. We will request permission before importing this data."
          ]
        },
        {
          title: "Camera, media, and fitness data",
          paragraphs: [
            "athmira uses camera access only when you start an analysis flow or grant permission for a related feature. Camera preview may run locally on your device, and media is stored only when the feature requires it or when you choose to save or upload it.",
            "Camera-based fit, aero, and nutrition outputs are preliminary, estimated, educational guidance. athmira does not provide medical diagnosis, injury prevention, professional bike fitting, professional coaching, or wind tunnel or CFD-grade aerodynamic results.",
            "Where required by law, we will ask for explicit consent before collecting or using sensitive health, biometric, wearable, or camera-derived data."
          ]
        },
        {
          title: "How we use information",
          bullets: [
            "Create and secure your account.",
            "Provide profile, bike, camera analysis, nutrition, tire pressure, dashboard, and settings features.",
            "Save and show analysis history, recommendations, and progress over time.",
            "Improve capture quality, scoring logic, product reliability, accessibility, and user experience.",
            "Provide support, respond to requests, and send service messages.",
            "Send marketing or educational updates only where permitted and based on your preferences.",
            "Detect, prevent, and investigate fraud, abuse, unauthorized access, security incidents, and violations of our Terms.",
            "Comply with legal obligations, enforce agreements, and protect the rights, safety, and property of users, athmira, and others."
          ]
        },
        {
          title: "Legal bases for processing",
          paragraphs: [
            "For users in the European Economic Area, United Kingdom, or similar jurisdictions, we process personal data under one or more of these legal bases: performance of a contract, your consent, our legitimate interests, compliance with legal obligations, and protection of vital interests where strictly necessary.",
            "You may withdraw consent at any time where processing is based on consent. Withdrawal does not affect processing that happened before withdrawal."
          ]
        },
        {
          title: "How we share information",
          bullets: [
            "Service providers and processors that host, secure, authenticate, deploy, email, monitor, analyze, or support the service, such as Supabase and Vercel, under contractual obligations where required.",
            "Third-party integrations you choose to connect, but only according to your permissions and the integration's scope.",
            "Professional advisers, auditors, insurers, or legal representatives when reasonably necessary.",
            "Authorities, courts, regulators, or other parties when required by law or when necessary to protect rights, safety, security, or prevent abuse.",
            "Successors in a merger, acquisition, financing, reorganization, or sale of assets, subject to appropriate safeguards."
          ],
          paragraphs: [
            "We do not sell personal information for money. We do not knowingly sell or share sensitive personal information for cross-context behavioral advertising. If we add advertising or analytics practices that qualify as a sale, sharing, or targeted advertising under applicable law, we will update this policy and provide required choices."
          ]
        },
        {
          title: "Cookies, local storage, and similar technologies",
          paragraphs: [
            "athmira may use cookies, local storage, and similar technologies to keep you signed in, remember language preferences, protect forms, measure service performance, and improve reliability. You can control browser cookies through your browser settings, but some features may not work without required storage."
          ]
        },
        {
          title: "Retention",
          paragraphs: [
            "We keep personal information for as long as needed to provide the service, maintain your account, comply with legal obligations, resolve disputes, enforce agreements, secure the platform, and keep appropriate business records.",
            "You may request deletion of your account or certain data. Some information may be retained where required by law, for security logs, backup integrity, dispute resolution, or legitimate business purposes. We may keep de-identified or aggregated data that no longer identifies you."
          ]
        },
        {
          title: "Security",
          paragraphs: [
            "We use administrative, technical, and organizational safeguards designed to protect personal information, including authentication controls, row-level authorization patterns, private storage for sensitive media, signed access patterns where appropriate, least-privilege access, audit trails for privileged actions, and secure deployment practices.",
            "No system is perfectly secure. If you believe your account or data may be at risk, contact us promptly."
          ]
        },
        {
          title: "International transfers",
          paragraphs: [
            "athmira may process information in countries other than where you live. Where required, we use appropriate safeguards for international transfers, such as contractual protections, vendor commitments, or other lawful transfer mechanisms."
          ]
        },
        {
          title: "Your privacy rights",
          paragraphs: [
            `Depending on where you live, you may have rights to access, correct, delete, restrict, object to processing, withdraw consent, receive a portable copy of data, opt out of certain marketing, opt out of sale, sharing, targeted advertising, or profiling, and appeal a decision about a rights request. To exercise rights, contact ${CONTACT_EMAIL}.`,
            "We may need to verify your identity before fulfilling a request. You may also have the right to complain to your local data protection authority or regulator."
          ]
        },
        {
          title: "Children",
          paragraphs: [
            "athmira is not directed to children under 16. We do not knowingly collect personal information from children under 16. If you believe a child has provided personal information, contact us so we can review and delete it where appropriate."
          ]
        },
        {
          title: "HIPAA and medical privacy",
          paragraphs: [
            "Unless we expressly state otherwise in a separate agreement, athmira is not intended to act as a HIPAA covered entity or business associate. Do not use athmira for emergency, diagnostic, medical treatment, or clinical decision-making purposes."
          ]
        },
        {
          title: "Changes to this policy",
          paragraphs: [
            "We may update this Privacy Policy as the product, laws, or our practices change. We will update the effective date and provide additional notice where required."
          ]
        }
      ]
    },
    es: {
      description:
        "Política de Privacidad de athmira, incluyendo recolección, uso, divulgación, retención, seguridad y derechos de los usuarios.",
      effectiveDate: EFFECTIVE_DATE_ES,
      title: "Política de Privacidad",
      intro: [
        "Esta Política de Privacidad explica cómo athmira recolecta, usa, almacena, comparte y protege datos personales cuando usas athmira.com y la aplicación athmira.",
        "athmira está construido para atletas de endurance y puede tratar datos de fitness, configuración de bicicleta, cámara, análisis, nutrición y cuenta. Tratamos esta información como datos sensibles del atleta incluso cuando una ley específica no clasifique cada campo como sensible."
      ],
      sections: [
        {
          title: "Quiénes somos y cómo contactarnos",
          paragraphs: [
            `athmira es el responsable del tratamiento o negocio responsable de los datos personales tratados por el servicio, salvo que un acuerdo separado indique algo distinto. Puedes contactarnos en ${CONTACT_EMAIL} para preguntas de privacidad, seguridad o solicitudes de derechos.`,
            "Si athmira designa más adelante un oficial de protección de datos, representante o contacto dedicado de privacidad, actualizaremos esta política con esos datos."
          ]
        },
        {
          title: "Información que recolectamos",
          bullets: [
            "Datos de cuenta, como nombre, correo electrónico, identificadores de autenticación, credenciales gestionadas por nuestro proveedor de autenticación, idioma preferido y preferencia de newsletter.",
            "Perfil y contexto del atleta, como fecha de nacimiento, género, altura, peso y otra información que decidas dar para personalizar la guía.",
            "Datos de bicicleta y equipo, incluyendo tipo de bicicleta, marca, modelo, talla, altura de sillín, retroceso, potencia, bielas, ancho de manubrio, montaje de llantas, ancho de llanta, planes de presión y notas relacionadas.",
            "Datos de cámara y análisis, incluyendo permisos de cámara, vista previa local, fotos o medios que decidas capturar o subir, sesiones de fit, estimaciones de ángulos, postura, puntajes aero, puntajes de confianza, recomendaciones e historial de análisis.",
            "Datos de nutrición y planeación, incluyendo duración de rodada, intensidad, carbohidratos, líquidos, sodio, selección de productos y planes guardados.",
            "Datos técnicos, de uso y seguridad, incluyendo dirección IP, tipo de dispositivo o navegador, sistema operativo, versión de la app, logs, errores, región aproximada y eventos necesarios para operar y proteger el servicio.",
            "Comunicaciones, incluyendo mensajes de soporte, comunicaciones administrativas, reportes de seguridad y preferencias de marketing.",
            "Datos de integraciones futuras, si conectas un wearable o servicio externo, como Garmin, Strava, Apple Health, Google Fit, Wahoo o TrainingPeaks. Pediremos permiso antes de importar estos datos."
          ]
        },
        {
          title: "Cámara, medios y datos de fitness",
          paragraphs: [
            "athmira usa acceso a cámara solo cuando inicias un flujo de análisis o das permiso para una función relacionada. La vista previa puede ejecutarse localmente en tu dispositivo, y los medios se almacenan solo cuando la función lo requiere o cuando decides guardar o subir contenido.",
            "Los resultados de fit, aero y nutrición basados en cámara son guía preliminar, estimada y educativa. athmira no ofrece diagnóstico médico, prevención de lesiones, bike fitting profesional, coaching profesional ni resultados aerodinámicos equivalentes a túnel de viento o CFD.",
            "Cuando la ley lo requiera, pediremos consentimiento explícito antes de recolectar o usar datos sensibles de salud, biométricos, wearables o derivados de cámara."
          ]
        },
        {
          title: "Cómo usamos la información",
          bullets: [
            "Crear y proteger tu cuenta.",
            "Proveer funciones de perfil, bicicletas, análisis con cámara, nutrición, presión de llantas, dashboard y configuración.",
            "Guardar y mostrar historial de análisis, recomendaciones y progreso en el tiempo.",
            "Mejorar calidad de captura, lógica de puntajes, confiabilidad, accesibilidad y experiencia de usuario.",
            "Dar soporte, responder solicitudes y enviar mensajes de servicio.",
            "Enviar novedades educativas o de marketing solo cuando esté permitido y según tus preferencias.",
            "Detectar, prevenir e investigar fraude, abuso, accesos no autorizados, incidentes de seguridad y violaciones de nuestros Términos.",
            "Cumplir obligaciones legales, hacer cumplir acuerdos y proteger derechos, seguridad y propiedad de usuarios, athmira y terceros."
          ]
        },
        {
          title: "Bases legales para el tratamiento",
          paragraphs: [
            "Para usuarios en el Espacio Económico Europeo, Reino Unido o jurisdicciones similares, tratamos datos personales bajo una o más de estas bases: ejecución de un contrato, tu consentimiento, intereses legítimos, cumplimiento de obligaciones legales y protección de intereses vitales cuando sea estrictamente necesario.",
            "Puedes retirar tu consentimiento en cualquier momento cuando el tratamiento se base en consentimiento. El retiro no afecta el tratamiento realizado antes del retiro."
          ]
        },
        {
          title: "Cómo compartimos información",
          bullets: [
            "Proveedores y encargados que alojan, protegen, autentican, despliegan, envían correos, monitorean, analizan o soportan el servicio, como Supabase y Vercel, bajo obligaciones contractuales cuando aplique.",
            "Integraciones de terceros que decidas conectar, únicamente según tus permisos y el alcance de la integración.",
            "Asesores profesionales, auditores, aseguradoras o representantes legales cuando sea razonablemente necesario.",
            "Autoridades, cortes, reguladores u otras partes cuando lo exija la ley o sea necesario para proteger derechos, seguridad o prevenir abuso.",
            "Sucesores en una fusión, adquisición, financiación, reorganización o venta de activos, sujeto a salvaguardas apropiadas."
          ],
          paragraphs: [
            "No vendemos datos personales por dinero. No vendemos ni compartimos de forma consciente datos personales sensibles para publicidad comportamental entre contextos. Si agregamos publicidad o analítica que califique como venta, compartición o publicidad dirigida bajo la ley aplicable, actualizaremos esta política y daremos las opciones requeridas."
          ]
        },
        {
          title: "Cookies, almacenamiento local y tecnologías similares",
          paragraphs: [
            "athmira puede usar cookies, almacenamiento local y tecnologías similares para mantener tu sesión, recordar idioma, proteger formularios, medir desempeño y mejorar confiabilidad. Puedes controlar cookies desde tu navegador, pero algunas funciones pueden no operar sin almacenamiento requerido."
          ]
        },
        {
          title: "Retención",
          paragraphs: [
            "Conservamos datos personales mientras sea necesario para prestar el servicio, mantener tu cuenta, cumplir obligaciones legales, resolver disputas, hacer cumplir acuerdos, proteger la plataforma y mantener registros de negocio apropiados.",
            "Puedes solicitar eliminación de tu cuenta o ciertos datos. Alguna información puede conservarse cuando la ley lo exija, por logs de seguridad, integridad de copias de respaldo, resolución de disputas o fines legítimos de negocio. Podemos conservar datos desidentificados o agregados que ya no te identifiquen."
          ]
        },
        {
          title: "Seguridad",
          paragraphs: [
            "Usamos salvaguardas administrativas, técnicas y organizacionales diseñadas para proteger datos personales, incluyendo controles de autenticación, patrones de autorización por filas, almacenamiento privado para medios sensibles, accesos firmados cuando corresponda, mínimo privilegio, auditoría de acciones privilegiadas y prácticas seguras de despliegue.",
            "Ningún sistema es perfectamente seguro. Si crees que tu cuenta o tus datos pueden estar en riesgo, contáctanos pronto."
          ]
        },
        {
          title: "Transferencias internacionales",
          paragraphs: [
            "athmira puede tratar información en países distintos al tuyo. Cuando aplique, usamos salvaguardas apropiadas para transferencias internacionales, como protecciones contractuales, compromisos de proveedores u otros mecanismos legales."
          ]
        },
        {
          title: "Tus derechos de privacidad",
          paragraphs: [
            `Según dónde vivas, puedes tener derechos de acceso, corrección, eliminación, restricción, oposición, retiro de consentimiento, portabilidad, exclusión de cierto marketing, exclusión de venta, compartición, publicidad dirigida o perfilamiento, y apelación de decisiones sobre solicitudes. Para ejercerlos, contacta ${CONTACT_EMAIL}.`,
            "Podemos necesitar verificar tu identidad antes de responder una solicitud. También puedes tener derecho a presentar una queja ante tu autoridad local de protección de datos o regulador."
          ]
        },
        {
          title: "Niños, niñas y adolescentes",
          paragraphs: [
            "athmira no está dirigido a menores de 16 años. No recolectamos conscientemente datos personales de menores de 16 años. Si crees que un menor nos entregó datos personales, contáctanos para revisarlo y eliminarlos cuando corresponda."
          ]
        },
        {
          title: "HIPAA y privacidad médica",
          paragraphs: [
            "Salvo que indiquemos expresamente algo distinto en un acuerdo separado, athmira no está destinado a actuar como entidad cubierta o socio comercial bajo HIPAA. No uses athmira para emergencias, diagnósticos, tratamientos médicos o decisiones clínicas."
          ]
        },
        {
          title: "Cambios a esta política",
          paragraphs: [
            "Podemos actualizar esta Política de Privacidad cuando cambie el producto, la ley o nuestras prácticas. Actualizaremos la fecha de vigencia y daremos aviso adicional cuando sea requerido."
          ]
        }
      ]
    }
  },
  terms: {
    en: {
      description:
        "Terms and Conditions for using athmira, including account rules, acceptable use, athlete guidance disclaimers, and limitations.",
      effectiveDate: EFFECTIVE_DATE_EN,
      title: "Terms and Conditions",
      intro: [
        "These Terms and Conditions govern your access to and use of athmira.com and the athmira application. By creating an account, accessing the service, or using any feature, you agree to these Terms.",
        "If you do not agree, do not use athmira."
      ],
      sections: [
        {
          title: "The service",
          paragraphs: [
            "athmira provides web-first, mobile-ready tools for endurance athletes, including bike profiles, camera-based bike fit guidance, estimated aero guidance, tire pressure planning, nutrition planning, dashboards, and related educational features.",
            "Some features are mock, beta, experimental, or preliminary. We may add, change, suspend, or remove features at any time."
          ]
        },
        {
          title: "Eligibility",
          paragraphs: [
            "You must be at least 16 years old to use athmira. If the law where you live requires a higher age or parental consent, you may use athmira only if that requirement is satisfied.",
            "You must provide accurate account information and keep your credentials secure. You are responsible for activity under your account."
          ]
        },
        {
          title: "Not medical, professional fitting, or safety advice",
          paragraphs: [
            "athmira provides educational and training guidance only. It does not provide medical advice, diagnosis, treatment, injury prevention, physical therapy, professional coaching, professional bike fitting, nutrition therapy, or emergency services.",
            "Camera-based fit, aero, knee tracking, tire pressure, and nutrition outputs are estimates. They can be affected by camera angle, lighting, clothing, equipment setup, body position, sensor quality, user input, and software limitations.",
            "Consult a qualified physician, physical therapist, coach, registered dietitian, bike fitter, mechanic, or other professional before making decisions that may affect your health, safety, equipment, race preparation, or training load. If you have pain, numbness, dizziness, injury symptoms, or medical concerns, stop and seek professional advice."
          ]
        },
        {
          title: "Your responsibilities",
          bullets: [
            "Use athmira lawfully and only for personal, educational, training, or internal evaluation purposes.",
            "Confirm that your bike, equipment, tires, wheels, brakes, and riding setup are safe before riding.",
            "Do not rely on athmira as the only source for safety, health, training, bike fit, nutrition, or equipment decisions.",
            "Do not upload content that you do not have the right to use or that violates another person's privacy.",
            "Do not misuse camera features, attempt unauthorized access, interfere with the service, scrape the service, reverse engineer restricted parts, or bypass security controls.",
            "Do not use athmira to build a competing product in a way that violates applicable law or our intellectual property rights."
          ]
        },
        {
          title: "User content and athlete data",
          paragraphs: [
            "You keep ownership of your profile data, bike data, media, notes, and other content you provide. You grant athmira a limited, worldwide, non-exclusive license to host, process, transmit, display, analyze, and use that content only to operate, secure, support, improve, and provide the service, and as otherwise described in the Privacy Policy.",
            "You represent that you have the rights and permissions needed to upload or submit content to athmira."
          ]
        },
        {
          title: "Privacy",
          paragraphs: [
            "Our Privacy Policy explains how we collect, use, share, retain, and protect personal information. By using athmira, you acknowledge that your information will be processed as described in the Privacy Policy."
          ]
        },
        {
          title: "Third-party services",
          paragraphs: [
            "athmira may rely on third-party services for authentication, hosting, deployment, storage, analytics, security, email, bot protection, payments, or future wearable integrations. Third-party services may have their own terms and privacy policies.",
            "We are not responsible for third-party services that you choose to connect, visit, or use outside athmira."
          ]
        },
        {
          title: "Accounts, admins, and security",
          paragraphs: [
            "athmira may provide administrative tools for authorized administrators. Admin access is a privileged role and may be logged, reviewed, limited, revoked, or audited.",
            "You must notify us promptly if you suspect unauthorized access to your account or a security vulnerability. Do not publicly disclose vulnerabilities until we have had a reasonable opportunity to investigate and remediate."
          ]
        },
        {
          title: "Paid features",
          paragraphs: [
            "athmira may offer paid features in the future. If paid features are introduced, additional payment, subscription, cancellation, refund, tax, and billing terms may apply and will be shown before purchase where required."
          ]
        },
        {
          title: "Intellectual property",
          paragraphs: [
            "athmira, athmira.com, logos, designs, software, content, workflows, and product names are owned by athmira or its licensors and are protected by intellectual property laws. Except for rights expressly granted in these Terms, no rights are transferred to you.",
            "If you send feedback, suggestions, or ideas, you allow us to use them without restriction or compensation."
          ]
        },
        {
          title: "Availability and changes",
          paragraphs: [
            "We aim to provide a reliable service, but athmira may be interrupted, delayed, inaccurate, unavailable, or changed. We do not guarantee that the service will be error-free, uninterrupted, secure, or available in every location or on every device."
          ]
        },
        {
          title: "Suspension and termination",
          paragraphs: [
            "You may stop using athmira at any time. We may suspend or terminate access if we believe you violated these Terms, created risk, misused the service, failed to pay amounts due for future paid features, or if continued access would violate law or third-party rights."
          ]
        },
        {
          title: "Disclaimers",
          paragraphs: [
            "To the maximum extent permitted by law, athmira is provided as is and as available, without warranties of any kind, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, title, non-infringement, accuracy, availability, or safety outcomes."
          ]
        },
        {
          title: "Limitation of liability",
          paragraphs: [
            "To the maximum extent permitted by law, athmira and its affiliates, officers, employees, contractors, and licensors will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, injury, equipment damage, training errors, race outcomes, or business interruption arising from or related to your use of the service.",
            "Where liability cannot be excluded, it is limited to the greater of the amount you paid to use athmira in the three months before the claim or 100 US dollars, unless applicable law requires a different limit."
          ]
        },
        {
          title: "Indemnity",
          paragraphs: [
            "To the extent permitted by law, you agree to defend, indemnify, and hold harmless athmira from claims, damages, liabilities, losses, and expenses arising from your misuse of the service, violation of these Terms, violation of law, or infringement of third-party rights."
          ]
        },
        {
          title: "Governing law and disputes",
          paragraphs: [
            "These Terms are governed by the laws of the State of New York, United States, unless mandatory consumer protection or privacy law in your location requires otherwise. Courts located in New York County, New York, will have exclusive jurisdiction where legally permitted.",
            "Before filing a claim, you agree to contact us and try to resolve the dispute informally."
          ]
        },
        {
          title: "Changes to these Terms",
          paragraphs: [
            "We may update these Terms as the product, law, or business changes. We will update the effective date and provide additional notice where required. Continued use after changes become effective means you accept the updated Terms."
          ]
        },
        {
          title: "Contact",
          paragraphs: [`Questions about these Terms can be sent to ${CONTACT_EMAIL}.`]
        }
      ]
    },
    es: {
      description:
        "Términos y Condiciones para usar athmira, incluyendo reglas de cuenta, uso aceptable, aclaraciones de guía deportiva y limitaciones.",
      effectiveDate: EFFECTIVE_DATE_ES,
      title: "Términos y Condiciones",
      intro: [
        "Estos Términos y Condiciones regulan tu acceso y uso de athmira.com y la aplicación athmira. Al crear una cuenta, acceder al servicio o usar cualquier función, aceptas estos Términos.",
        "Si no estás de acuerdo, no uses athmira."
      ],
      sections: [
        {
          title: "El servicio",
          paragraphs: [
            "athmira ofrece herramientas web-first y listas para móvil para atletas de endurance, incluyendo perfiles de bicicleta, guía de Bike Fit basada en cámara, guía aero estimada, planeación de presión de llantas, nutrición, dashboards y funciones educativas relacionadas.",
            "Algunas funciones son simuladas, beta, experimentales o preliminares. Podemos agregar, cambiar, suspender o eliminar funciones en cualquier momento."
          ]
        },
        {
          title: "Elegibilidad",
          paragraphs: [
            "Debes tener al menos 16 años para usar athmira. Si la ley donde vives exige una edad mayor o consentimiento parental, solo puedes usar athmira si cumples ese requisito.",
            "Debes dar información de cuenta precisa y mantener tus credenciales seguras. Eres responsable por la actividad en tu cuenta."
          ]
        },
        {
          title: "No es consejo médico, fit profesional ni seguridad",
          paragraphs: [
            "athmira ofrece guía educativa y de entrenamiento únicamente. No ofrece consejo médico, diagnóstico, tratamiento, prevención de lesiones, fisioterapia, coaching profesional, bike fitting profesional, terapia nutricional ni servicios de emergencia.",
            "Los resultados de fit, aero, tracking de rodilla, presión de llantas y nutrición basados en cámara son estimaciones. Pueden verse afectados por ángulo de cámara, iluminación, ropa, configuración del equipo, posición corporal, calidad de sensores, datos ingresados y limitaciones del software.",
            "Consulta a un médico, fisioterapeuta, entrenador, nutricionista/dietista registrado, bike fitter, mecánico u otro profesional calificado antes de tomar decisiones que puedan afectar tu salud, seguridad, equipo, preparación de carrera o carga de entrenamiento. Si tienes dolor, adormecimiento, mareo, síntomas de lesión o dudas médicas, detente y busca consejo profesional."
          ]
        },
        {
          title: "Tus responsabilidades",
          bullets: [
            "Usar athmira de forma legal y solo para fines personales, educativos, de entrenamiento o evaluación interna.",
            "Confirmar que tu bicicleta, equipo, llantas, ruedas, frenos y configuración de rodada estén seguros antes de rodar.",
            "No depender de athmira como única fuente para decisiones de seguridad, salud, entrenamiento, bike fit, nutrición o equipo.",
            "No subir contenido que no tengas derecho a usar o que viole la privacidad de otra persona.",
            "No abusar de funciones de cámara, intentar acceso no autorizado, interferir con el servicio, extraer datos masivamente, hacer ingeniería inversa de partes restringidas ni evadir controles de seguridad.",
            "No usar athmira para construir un producto competidor de forma que viole la ley aplicable o nuestros derechos de propiedad intelectual."
          ]
        },
        {
          title: "Contenido del usuario y datos del atleta",
          paragraphs: [
            "Mantienes la propiedad de tus datos de perfil, bicicleta, medios, notas y demás contenido que entregues. Concedes a athmira una licencia limitada, mundial y no exclusiva para alojar, procesar, transmitir, mostrar, analizar y usar ese contenido solo para operar, proteger, soportar, mejorar y prestar el servicio, y según se describe en la Política de Privacidad.",
            "Declaras que tienes los derechos y permisos necesarios para subir o enviar contenido a athmira."
          ]
        },
        {
          title: "Privacidad",
          paragraphs: [
            "Nuestra Política de Privacidad explica cómo recolectamos, usamos, compartimos, retenemos y protegemos datos personales. Al usar athmira, reconoces que tu información será tratada como se describe en la Política de Privacidad."
          ]
        },
        {
          title: "Servicios de terceros",
          paragraphs: [
            "athmira puede depender de servicios de terceros para autenticación, hosting, despliegue, almacenamiento, analítica, seguridad, correo, protección contra bots, pagos o futuras integraciones con wearables. Esos servicios pueden tener sus propios términos y políticas de privacidad.",
            "No somos responsables por servicios de terceros que decidas conectar, visitar o usar fuera de athmira."
          ]
        },
        {
          title: "Cuentas, admins y seguridad",
          paragraphs: [
            "athmira puede ofrecer herramientas administrativas para administradores autorizados. El acceso admin es un rol privilegiado y puede ser registrado, revisado, limitado, revocado o auditado.",
            "Debes notificarnos pronto si sospechas acceso no autorizado a tu cuenta o una vulnerabilidad de seguridad. No divulgues vulnerabilidades públicamente hasta que hayamos tenido una oportunidad razonable de investigarlas y corregirlas."
          ]
        },
        {
          title: "Funciones pagas",
          paragraphs: [
            "athmira puede ofrecer funciones pagas en el futuro. Si se introducen funciones pagas, podrán aplicar términos adicionales de pago, suscripción, cancelación, reembolso, impuestos y facturación, y se mostrarán antes de la compra cuando sea requerido."
          ]
        },
        {
          title: "Propiedad intelectual",
          paragraphs: [
            "athmira, athmira.com, logos, diseños, software, contenido, flujos y nombres de producto pertenecen a athmira o sus licenciantes y están protegidos por leyes de propiedad intelectual. Salvo los derechos expresamente otorgados en estos Términos, no se te transfiere ningún derecho.",
            "Si envías comentarios, sugerencias o ideas, nos permites usarlos sin restricción ni compensación."
          ]
        },
        {
          title: "Disponibilidad y cambios",
          paragraphs: [
            "Buscamos ofrecer un servicio confiable, pero athmira puede interrumpirse, retrasarse, ser inexacto, no estar disponible o cambiar. No garantizamos que el servicio sea libre de errores, ininterrumpido, seguro o disponible en todo lugar o dispositivo."
          ]
        },
        {
          title: "Suspensión y terminación",
          paragraphs: [
            "Puedes dejar de usar athmira en cualquier momento. Podemos suspender o terminar acceso si creemos que violaste estos Términos, creaste riesgo, abusaste del servicio, no pagaste montos debidos por futuras funciones pagas, o si continuar el acceso violaría la ley o derechos de terceros."
          ]
        },
        {
          title: "Exclusión de garantías",
          paragraphs: [
            "En la máxima medida permitida por la ley, athmira se entrega tal como está y según disponibilidad, sin garantías de ningún tipo, expresas, implícitas, legales o de otro tipo, incluyendo garantías de comerciabilidad, idoneidad para un fin particular, titularidad, no infracción, exactitud, disponibilidad o resultados de seguridad."
          ]
        },
        {
          title: "Limitación de responsabilidad",
          paragraphs: [
            "En la máxima medida permitida por la ley, athmira y sus afiliados, directivos, empleados, contratistas y licenciantes no serán responsables por daños indirectos, incidentales, especiales, consecuenciales, ejemplares o punitivos, ni por lucro cesante, pérdida de datos, lesiones, daño a equipo, errores de entrenamiento, resultados de carrera o interrupción de negocio derivados o relacionados con el uso del servicio.",
            "Cuando la responsabilidad no pueda excluirse, se limita al mayor valor entre lo que pagaste por usar athmira en los tres meses anteriores al reclamo o 100 dólares estadounidenses, salvo que la ley aplicable exija otro límite."
          ]
        },
        {
          title: "Indemnidad",
          paragraphs: [
            "En la medida permitida por la ley, aceptas defender, indemnizar y mantener indemne a athmira frente a reclamos, daños, responsabilidades, pérdidas y gastos derivados de tu uso indebido del servicio, violación de estos Términos, violación de la ley o infracción de derechos de terceros."
          ]
        },
        {
          title: "Ley aplicable y disputas",
          paragraphs: [
            "Estos Términos se rigen por las leyes del Estado de Nueva York, Estados Unidos, salvo que la ley obligatoria de protección al consumidor o privacidad de tu ubicación exija algo distinto. Los tribunales ubicados en el Condado de Nueva York, Nueva York, tendrán jurisdicción exclusiva cuando sea legalmente permitido.",
            "Antes de presentar un reclamo, aceptas contactarnos e intentar resolver la disputa de forma informal."
          ]
        },
        {
          title: "Cambios a estos Términos",
          paragraphs: [
            "Podemos actualizar estos Términos cuando cambie el producto, la ley o el negocio. Actualizaremos la fecha de vigencia y daremos aviso adicional cuando sea requerido. El uso continuado después de que los cambios entren en vigor significa que aceptas los Términos actualizados."
          ]
        },
        {
          title: "Contacto",
          paragraphs: [`Preguntas sobre estos Términos pueden enviarse a ${CONTACT_EMAIL}.`]
        }
      ]
    }
  }
};

export function LegalPage({ route }: { route: LegalRoute }) {
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const document = legalDocuments[route][language];
  const canonicalPath = route === "privacy" ? "/privacy" : "/terms";
  const seoTitle = `athmira | ${document.title}`;
  const compact = width < 620;

  return (
    <>
      <SeoHead
        canonicalPath={canonicalPath}
        description={document.description}
        lang={language}
        title={seoTitle}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.page, pageWebStyle]}>
          <View style={[styles.hero, panelWebStyle, compact && styles.panelCompact]}>
            <Text selectable style={[styles.kicker, textWebStyle]}>
              athmira legal
            </Text>
            <Heading style={[styles.title, legalTextBoxStyle, textWebStyle]}>{document.title}</Heading>
            <Text selectable style={[styles.effectiveDate, legalTextBoxStyle, textWebStyle]}>
              {language === "es" ? "Fecha de vigencia" : "Effective date"}: {document.effectiveDate}
            </Text>
            {document.intro.map((paragraph) => (
              <Body key={paragraph} style={[styles.intro, legalTextBoxStyle, textWebStyle]}>
                {paragraph}
              </Body>
            ))}
          </View>

          <View style={styles.sectionStack}>
            {document.sections.map((section) => (
              <View key={section.title} style={[styles.section, panelWebStyle, compact && styles.panelCompact]}>
                <Text selectable style={[styles.sectionTitle, legalTextBoxStyle, textWebStyle]}>
                  {section.title}
                </Text>
                {section.paragraphs?.map((paragraph) => (
                  <Text key={paragraph} selectable style={[styles.paragraph, legalTextBoxStyle, textWebStyle]}>
                    {paragraph}
                  </Text>
                ))}
                {section.bullets ? (
                  <View style={styles.bulletStack}>
                    {section.bullets.map((bullet) => (
                      <View key={bullet} style={styles.bulletRow}>
                        <Text selectable style={styles.bulletMarker}>
                          -
                        </Text>
                        <Text selectable style={[styles.bulletText, textWebStyle]}>
                          {bullet}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });
const pageWebStyle = Platform.select({
  default: undefined,
  web: {
    maxWidth: "920px",
    width: "calc(100vw - 32px)"
  } as never
});
const panelWebStyle = Platform.select({
  default: undefined,
  web: {
    boxSizing: "border-box",
    maxWidth: "100%",
    overflow: "hidden",
    width: "100%"
  } as never
});
const textWebStyle = Platform.select({
  default: undefined,
  web: {
    boxSizing: "border-box",
    display: "block",
    maxWidth: "100%",
    overflowWrap: "break-word",
    whiteSpace: "normal",
    width: "100%",
    wordBreak: "normal"
  } as never
});
const legalTextBoxStyle = {
  maxWidth: "100%",
  minWidth: 0,
  width: "100%"
} as const;

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg
  },
  page: {
    gap: spacing.xxl,
    maxWidth: 920,
    paddingBottom: spacing.xxxl,
    width: "100%"
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xxl,
    width: "100%"
  },
  panelCompact: {
    padding: spacing.xl
  },
  kicker: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.ink,
    fontFamily,
    fontSize: 40,
    lineHeight: 46
  },
  effectiveDate: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    lineHeight: 20
  },
  intro: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 17,
    lineHeight: 26
  },
  sectionStack: {
    gap: spacing.lg
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    width: "100%"
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  paragraph: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 16,
    lineHeight: 25
  },
  bulletStack: {
    gap: spacing.sm
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    minWidth: 0,
    width: "100%"
  },
  bulletMarker: {
    color: colors.primary,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black,
    lineHeight: 25
  },
  bulletText: {
    color: colors.inkMuted,
    flex: 1,
    fontFamily,
    fontSize: 16,
    lineHeight: 25,
    minWidth: 0
  }
});
