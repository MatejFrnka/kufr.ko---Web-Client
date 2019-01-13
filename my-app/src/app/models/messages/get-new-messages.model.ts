export class GetNewMessages {
    constructor(Id_Last: number, Groups: number[]) {
        this.Id_Last = Id_Last;
        this.Groups = Groups;
    }
    public Id_Last: number;
    public Groups: number[];
}