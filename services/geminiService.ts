/**
 * gossipService.ts
 * Handled static saloon gossip to remove dependency on external AI APIs.
 */

export const getSaloonGossip = async (score: number, level: number) => {
  const gossip = [
    "שמעתי שהשריף מחפש צלפים כמוך לעבודה חדשה.",
    "אל תשתה יותר מדי, העין שלך כבר לא משהו היום...",
    "אומרים שאתה היורה הכי מהיר במחוז, אולי אפילו בכל המערב!",
    "הבקבוקים פה רועדים רק מלשמוע את השם שלך.",
    "הברמן אמר שאתה גורם לו לנזקים כבדים, אבל הוא אוהב את המופע.",
    "וואו, כזאת פגיעה לא ראינו במסבאה הזאת מאז 1882!",
    "האינדיאנים בחוץ מתרשמים מהדיוק שלך, כדאי לך להיזהר.",
    "זה כל מה שיש לך? סבתא שלי יורה יותר טוב אחרי כוס ויסקי.",
    "הקברן כבר התחיל למדוד אותך, אבל בינתיים אתה שורד!",
    "אם תמשיך ככה, תוכל לקנות את כל המסבאה הזאת בקרוב.",
  ];
  
  // Return a random gossip string
  return gossip[Math.floor(Math.random() * gossip.length)];
};