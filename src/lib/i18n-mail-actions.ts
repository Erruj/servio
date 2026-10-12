import type { i18n as I18n } from 'i18next';

type Dict = Record<string, string>;

const nl: Dict = {
  restore: "Terugzetten", restored: "Teruggezet naar Inbox", notSpam: "Geen spam", emptyTrash: "Prullenbak legen", emptyTrashTitle: "Prullenbak legen?", emptyTrashDesc: "Alle mails in de prullenbak worden definitief uit Servio verwijderd. Dit kan niet ongedaan worden gemaakt.", trashEmptied: "Prullenbak geleegd", trashNote: "Mails in de prullenbak worden na 30 dagen automatisch verwijderd.", emptyFolderTitle: "Deze map is leeg", emptyFolderDesc: "Er staan hier momenteel geen mails.",
  mailboxFailed: 'Kon niet bijwerken in je mailbox',
  archive: 'Archiveren', delete: 'Verwijderen', markUnread: 'Markeer als ongelezen', markRead: 'Markeer als gelezen',
  star: 'Ster toevoegen', unstar: 'Ster verwijderen', more: 'Meer acties', labels: 'Labels', print: 'Afdrukken',
  viewOriginal: 'Origineel bekijken', downloadEml: 'Downloaden als .eml', markSpam: 'Markeer als spam',
  markPhishing: 'Markeer als phishing', markResolved: 'Markeer als afgehandeld',
  archived: 'Gearchiveerd', deleted: 'Naar prullenbak verplaatst', movedSpam: 'Gemarkeerd als spam', undo: 'Ongedaan maken',
  undone: 'Actie ongedaan gemaakt', actionFailed: 'Actie mislukt', actionFailedDesc: 'De wijziging kon niet worden opgeslagen. Controleer je verbinding en probeer het opnieuw.',
  originalTitle: 'Originele gegevens', originalNote: 'Servio bewaart niet alle ruwe headers; dit zijn de opgeslagen kopgegevens van deze mail.',
  labelsTitle: 'Labels beheren', labelsPlaceholder: 'Nieuw label', add: 'Toevoegen', save: 'Opslaan', cancel: 'Annuleren',
  labelsSaved: 'Labels opgeslagen', close: 'Sluiten',
  phishingTitle: 'Afzender geblokkeerd', phishingDesc: '{{from}} is gemarkeerd als phishing en geblokkeerd.',
};
const en: Dict = {
  restore: "Restore", restored: "Restored to Inbox", notSpam: "Not spam", emptyTrash: "Empty trash", emptyTrashTitle: "Empty trash?", emptyTrashDesc: "All emails in the trash will be permanently removed from Servio. This cannot be undone.", trashEmptied: "Trash emptied", trashNote: "Emails in the trash are deleted automatically after 30 days.", emptyFolderTitle: "This folder is empty", emptyFolderDesc: "There are no emails here right now.",
  mailboxFailed: 'Could not update your mailbox',
  archive: 'Archive', delete: 'Delete', markUnread: 'Mark as unread', markRead: 'Mark as read',
  star: 'Add star', unstar: 'Remove star', more: 'More actions', labels: 'Labels', print: 'Print',
  viewOriginal: 'View original', downloadEml: 'Download as .eml', markSpam: 'Mark as spam',
  markPhishing: 'Mark as phishing', markResolved: 'Mark as resolved',
  archived: 'Archived', deleted: 'Moved to trash', movedSpam: 'Marked as spam', undo: 'Undo',
  undone: 'Action undone', actionFailed: 'Action failed', actionFailedDesc: 'The change could not be saved. Check your connection and try again.',
  originalTitle: 'Original details', originalNote: 'Servio does not store all raw headers; these are the stored header details of this email.',
  labelsTitle: 'Manage labels', labelsPlaceholder: 'New label', add: 'Add', save: 'Save', cancel: 'Cancel',
  labelsSaved: 'Labels saved', close: 'Close',
  phishingTitle: 'Sender blocked', phishingDesc: '{{from}} has been marked as phishing and blocked.',
};
const de: Dict = {
  restore: "Wiederherstellen", restored: "In den Posteingang verschoben", notSpam: "Kein Spam", emptyTrash: "Papierkorb leeren", emptyTrashTitle: "Papierkorb leeren?", emptyTrashDesc: "Alle E-Mails im Papierkorb werden endgültig aus Servio gelöscht. Dies kann nicht rückgängig gemacht werden.", trashEmptied: "Papierkorb geleert", trashNote: "E-Mails im Papierkorb werden nach 30 Tagen automatisch gelöscht.", emptyFolderTitle: "Dieser Ordner ist leer", emptyFolderDesc: "Hier sind derzeit keine E-Mails.",
  mailboxFailed: 'Konnte dein Postfach nicht aktualisieren',
  archive: 'Archivieren', delete: 'Löschen', markUnread: 'Als ungelesen markieren', markRead: 'Als gelesen markieren',
  star: 'Stern hinzufügen', unstar: 'Stern entfernen', more: 'Weitere Aktionen', labels: 'Labels', print: 'Drucken',
  viewOriginal: 'Original anzeigen', downloadEml: 'Als .eml herunterladen', markSpam: 'Als Spam markieren',
  markPhishing: 'Als Phishing markieren', markResolved: 'Als erledigt markieren',
  archived: 'Archiviert', deleted: 'In den Papierkorb verschoben', movedSpam: 'Als Spam markiert', undo: 'Rückgängig',
  undone: 'Aktion rückgängig gemacht', actionFailed: 'Aktion fehlgeschlagen', actionFailedDesc: 'Die Änderung konnte nicht gespeichert werden. Prüfe deine Verbindung und versuche es erneut.',
  originalTitle: 'Originaldaten', originalNote: 'Servio speichert nicht alle Roh-Header; dies sind die gespeicherten Kopfdaten dieser E-Mail.',
  labelsTitle: 'Labels verwalten', labelsPlaceholder: 'Neues Label', add: 'Hinzufügen', save: 'Speichern', cancel: 'Abbrechen',
  labelsSaved: 'Labels gespeichert', close: 'Schließen',
  phishingTitle: 'Absender blockiert', phishingDesc: '{{from}} wurde als Phishing markiert und blockiert.',
};
const fr: Dict = {
  restore: "Restaurer", restored: "Remis dans la boîte de réception", notSpam: "Ce n'est pas du spam", emptyTrash: "Vider la corbeille", emptyTrashTitle: "Vider la corbeille ?", emptyTrashDesc: "Tous les e-mails de la corbeille seront définitivement supprimés de Servio. Cette action est irréversible.", trashEmptied: "Corbeille vidée", trashNote: "Les e-mails de la corbeille sont supprimés automatiquement après 30 jours.", emptyFolderTitle: "Ce dossier est vide", emptyFolderDesc: "Il n'y a actuellement aucun e-mail ici.",
  mailboxFailed: 'Impossible de mettre à jour votre boîte mail',
  archive: 'Archiver', delete: 'Supprimer', markUnread: 'Marquer comme non lu', markRead: 'Marquer comme lu',
  star: 'Ajouter une étoile', unstar: "Retirer l'étoile", more: "Plus d'actions", labels: 'Libellés', print: 'Imprimer',
  viewOriginal: "Afficher l'original", downloadEml: 'Télécharger en .eml', markSpam: 'Signaler comme spam',
  markPhishing: 'Signaler comme hameçonnage', markResolved: 'Marquer comme traité',
  archived: 'Archivé', deleted: 'Déplacé dans la corbeille', movedSpam: 'Signalé comme spam', undo: 'Annuler',
  undone: 'Action annulée', actionFailed: "Échec de l'action", actionFailedDesc: "La modification n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez.",
  originalTitle: "Données d'origine", originalNote: "Servio ne conserve pas tous les en-têtes bruts ; voici les données d'en-tête enregistrées de cet e-mail.",
  labelsTitle: 'Gérer les libellés', labelsPlaceholder: 'Nouveau libellé', add: 'Ajouter', save: 'Enregistrer', cancel: 'Annuler',
  labelsSaved: 'Libellés enregistrés', close: 'Fermer',
  phishingTitle: 'Expéditeur bloqué', phishingDesc: '{{from}} a été signalé comme hameçonnage et bloqué.',
};
const es: Dict = {
  restore: "Restaurar", restored: "Devuelto a la bandeja de entrada", notSpam: "No es spam", emptyTrash: "Vaciar papelera", emptyTrashTitle: "¿Vaciar la papelera?", emptyTrashDesc: "Todos los correos de la papelera se eliminarán definitivamente de Servio. Esta acción no se puede deshacer.", trashEmptied: "Papelera vaciada", trashNote: "Los correos de la papelera se eliminan automáticamente después de 30 días.", emptyFolderTitle: "Esta carpeta está vacía", emptyFolderDesc: "Ahora mismo no hay correos aquí.",
  mailboxFailed: 'No se pudo actualizar tu buzón',
  archive: 'Archivar', delete: 'Eliminar', markUnread: 'Marcar como no leído', markRead: 'Marcar como leído',
  star: 'Destacar', unstar: 'Quitar destacado', more: 'Más acciones', labels: 'Etiquetas', print: 'Imprimir',
  viewOriginal: 'Ver original', downloadEml: 'Descargar como .eml', markSpam: 'Marcar como spam',
  markPhishing: 'Marcar como phishing', markResolved: 'Marcar como resuelto',
  archived: 'Archivado', deleted: 'Movido a la papelera', movedSpam: 'Marcado como spam', undo: 'Deshacer',
  undone: 'Acción deshecha', actionFailed: 'La acción ha fallado', actionFailedDesc: 'No se pudo guardar el cambio. Comprueba tu conexión e inténtalo de nuevo.',
  originalTitle: 'Datos originales', originalNote: 'Servio no guarda todos los encabezados sin procesar; estos son los datos de encabezado guardados de este correo.',
  labelsTitle: 'Gestionar etiquetas', labelsPlaceholder: 'Nueva etiqueta', add: 'Añadir', save: 'Guardar', cancel: 'Cancelar',
  labelsSaved: 'Etiquetas guardadas', close: 'Cerrar',
  phishingTitle: 'Remitente bloqueado', phishingDesc: '{{from}} se ha marcado como phishing y se ha bloqueado.',
};

const folders: Record<string, Dict> = {"nl": {"label": "Mappen", "inbox": "Inbox", "starred": "Met ster", "drafts": "Concepten", "sent": "Verzonden", "archive": "Archief", "spam": "Spam", "trash": "Prullenbak"}, "en": {"label": "Folders", "inbox": "Inbox", "starred": "Starred", "drafts": "Drafts", "sent": "Sent", "archive": "Archive", "spam": "Spam", "trash": "Trash"}, "de": {"label": "Ordner", "inbox": "Posteingang", "starred": "Markiert", "drafts": "Entwürfe", "sent": "Gesendet", "archive": "Archiv", "spam": "Spam", "trash": "Papierkorb"}, "fr": {"label": "Dossiers", "inbox": "Boîte de réception", "starred": "Suivis", "drafts": "Brouillons", "sent": "Envoyés", "archive": "Archives", "spam": "Spam", "trash": "Corbeille"}, "es": {"label": "Carpetas", "inbox": "Bandeja de entrada", "starred": "Destacados", "drafts": "Borradores", "sent": "Enviados", "archive": "Archivo", "spam": "Spam", "trash": "Papelera"}};

export function registerMailActionTranslations(i18n: I18n) {
  const all = { nl, en, de, fr, es };
  for (const [lng, dict] of Object.entries(all)) {
    i18n.addResourceBundle(lng, 'translation', { mailActions: dict, mailFolders: folders[lng] }, true, false);
  }
}
