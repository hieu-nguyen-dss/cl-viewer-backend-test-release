export interface Behaivior {
  id: number;
  type: string;
}

export interface Behaiviors extends Array<Behaivior>{}

export const behaiviors: Behaiviors = [
  {id: 0, type: "stop"},
  {id: 1, type: "excavation"},
  {id: 2, type: "change of direction"},
  {id: 3, type: "forward"},
  {id: 4, type: "carrying"},
  {id: 5, type: "other"},
  {id: 99, type: "not detected"}
]