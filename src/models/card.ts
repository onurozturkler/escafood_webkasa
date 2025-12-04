export interface CreditCard {
  id: string;
  bankaId: string;
  kartAdi: string;
  kartLimit: number | null; // Allow null to represent "not set"
  limit: number | null; // Allow null to represent "not set"
  kullanilabilirLimit: number | null; // Allow null when limit is not set
  asgariOran: number;
  hesapKesimGunu: number;
  sonOdemeGunu: number;
  maskeliKartNo: string;
  aktifMi: boolean;
  sonEkstreBorcu: number;
  guncelBorc: number;
}
