export interface Instructor {
  callsign: string;
  name: string;
  roles: string[];
  aircraft: string[];
  pending: boolean;
}

export interface InstructorsData {
  note: string;
  instructors: Instructor[];
}
