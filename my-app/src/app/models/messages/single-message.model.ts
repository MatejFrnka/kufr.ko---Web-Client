import { UserInfo } from './user-info.model';
import { AttachmentMessage } from '../file/attachment-message.model';

export class SingleMessage{
    public Id : number;
    public Edited : boolean;
    public Text : string;
    public Id_Attachment : AttachmentMessage[];
    public Id_Group : number;
    public UserInfo : UserInfo;
    public Sent : Date;
    public UserIsSender: boolean;
}