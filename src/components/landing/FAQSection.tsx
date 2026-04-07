import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: 'Hoe werkt de AI?',
    answer: 'Servio gebruikt geavanceerde AI-modellen om je e-mails te analyseren en intelligente antwoordsuggesties te geven. De AI leert van je bedrijfscontext en past zich aan je communicatiestijl aan. Je behoudt altijd volledige controle over wat er verstuurd wordt.',
  },
  {
    question: 'Is mijn data veilig?',
    answer: 'Absoluut. We gebruiken enterprise-grade encryptie voor alle data. Je gegevens worden opgeslagen in beveiligde datacenters binnen de EU en we delen nooit informatie met derden. We voldoen aan alle AVG/GDPR-vereisten.',
  },
  {
    question: 'Kan ik facturen uploaden?',
    answer: 'Ja, je kunt facturen uploaden als PDF, JPG of PNG. Onze AI herkent automatisch bedragen, BTW, leveranciersnamen en andere belangrijke gegevens. Je kunt alles handmatig aanpassen indien nodig.',
  },
  {
    question: 'Heb ik een gratis proefperiode?',
    answer: 'Ja, je krijgt 14 dagen gratis toegang tot alle functies zonder creditcard. Na de proefperiode kun je kiezen voor een betaald abonnement of gewoon stoppen zonder verplichtingen.',
  },
  {
    question: 'Werkt Servio met mijn bestaande mailbox?',
    answer: 'Servio integreert naadloos met Gmail, Outlook/Office 365 en andere IMAP-mailboxen. De koppeling duurt slechts een paar minuten en je bestaande e-mails blijven onaangetast.',
  },
  {
    question: 'Kan ik Servio gebruiken met mijn team?',
    answer: 'Ja, met het Pro-plan kun je tot 3 teamleden toevoegen, en met het Business-plan heb je onbeperkte gebruikers. Je kunt verschillende rollen toewijzen met specifieke toegangsrechten.',
  },
];

export function FAQSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/30" aria-label="Veelgestelde vragen over Servio">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            Veelgestelde vragen
          </h2>
          <p className="text-muted-foreground">
            Heb je een andere vraag? <Link to="/contact" className="text-primary hover:underline">Neem contact op</Link> met ons support team.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border/40 rounded-xl px-5 data-[state=open]:border-border transition-all duration-200 animate-fade-in-up hover:border-border"
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
              >
                <AccordionTrigger className="text-left text-[15px] font-medium hover:no-underline py-4 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}