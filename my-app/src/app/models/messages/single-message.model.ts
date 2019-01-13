import { UserInfo } from './user-info.model';

export class SinlgeMessage{
    public Id : number;
    public Edited : boolean;
    public Text : string;
    public Id_Attachment : number[];
    public Id_Group : number;
    public UserInfo : UserInfo;
    public Sent : Date;
    public UserIsSender: boolean;
}