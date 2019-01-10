export class GetMessage {
    constructor(Id_Group: number,StartId: number,Amount: number  ) {
        this.Amount = Amount;
        this.StartId = StartId;
        this.Id_Group = Id_Group;
    }
    public Id_Group : number;
    public StartId : number;
    public Amount : number;
}