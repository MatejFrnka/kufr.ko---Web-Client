export class SendMessage {
    constructor(Id_Attachment: number[], Id_Group: number, MsgText: string) {
        this.Id_Attachment = Id_Attachment;
        this.Id_Group = Id_Group;
        this.Text = MsgText;
    }
    public Id_Attachment: number[];
    public Id_Group: number;
    public Text: string;
}