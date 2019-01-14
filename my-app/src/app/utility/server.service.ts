import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UserCredentials } from '../models/auth/user-credentials.model'
import { Response } from '../models/response.model';
import { GroupInfo } from '../models/group/group-info.model';
import { CookieService } from 'ngx-cookie-service';
import { GetMessage } from '../models/messages/get-message.model';
import { SendMessage } from '../models/messages/send-message.model';
import { GetNewMessages } from '../models/messages/get-new-messages.model';
import { Observable } from 'rxjs';



@Injectable()

export class Server {
    private ServerUrl = "http://kufrko-rest-api.azurewebsites.net/api/";
    //private ServerUrl = "http://localhost:49608/api/";
    constructor(private http: HttpClient, private cookieService: CookieService, ) {
    }
    LogIn(email: string, password: string): Promise<Response> {
        let httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }
        let credentials: UserCredentials = new UserCredentials();
        credentials.Email = email;
        credentials.Password = password;

        return this.http.post<Response>(this.ServerUrl + "Auth/Login", JSON.stringify(credentials), httpOptions)
            .toPromise()
            .then((response) => response);
    }
    Register(email: string, password: string, username: string): Promise<Response> {
        let httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }
        let credentials: UserCredentials = new UserCredentials();
        credentials.Email = email;
        credentials.Password = password;
        credentials.Name = username;

        return this.http.post<Response>(this.ServerUrl + "Auth/Register", JSON.stringify(credentials), httpOptions)
            .toPromise()
            .then((response) => response);
    }
    /***GROUPS***/
    GetGroups(): Promise<Response> {
        let httpOptions = this.getHeaders();
        return this.http.get<Response>(this.ServerUrl + "Group/GetAll", {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }
    /***MESSAGES***/
    GetNewMessages(groupIds: number[], lastId: number) {
        let httpOptions = this.getHeaders();
        let newMessages: GetNewMessages = new GetNewMessages(lastId, groupIds)
        return this.http.post<Response>(this.ServerUrl + "Message/GetNewMessages", JSON.stringify(newMessages), {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }
    GetMessages(groupId: number, amount: number, startId: number = 0): Promise<Response> {
        let httpOptions = this.getHeaders();
        let getMessage = new GetMessage(groupId, startId, amount)
        return this.http.post<Response>(this.ServerUrl + "Message/GetMessages", JSON.stringify(getMessage), {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }
    SendMessage(Id_Attachment: number[], Id_Group: number, MsgText: string): Promise<Response> {
        let message = new SendMessage(Id_Attachment, Id_Group, MsgText);
        let httpOptions = this.getHeaders();
        return this.http.post<Response>(this.ServerUrl + "Message/SendMessage", JSON.stringify(message), {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }
    /***FRIENDS***/
    GetExistingFriends(): Promise<Response> {
        let httpOptions = this.getHeaders();
        return this.http.get<Response>(this.ServerUrl + "Friend/LoadExistingFriends", {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }
    GetPendingFriends(): Promise<Response> {
        let httpOptions = this.getHeaders();
        return this.http.get<Response>(this.ServerUrl + "Friend/LoadPending", {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }
    UpdateFriendStatus(FriendId: number, FriendStatus: number): Promise<Response> {
        let params = new HttpParams().set("IdReceiver", FriendId.toString()).set("friendStatus", FriendStatus.toString());

        let headers = this.getHeaders();

        return this.http.patch<Response>(this.ServerUrl + "Friend/ChangeFriendStatus", null, { headers: headers, params: params })
            .toPromise()
            .then((response) => response);
    }
    SendFriendRequest(RecieverId: number): Promise<Response> {
        let params = new HttpParams().set("IdReceiver", RecieverId.toString());

        let headers = this.getHeaders();

        return this.http.post<Response>(this.ServerUrl + "Friend/CreateFriendRequest", null, {headers: headers, params: params})
            .toPromise()
            .then((response) => response);
    }
    SearchFriend(name: string): Observable<Response> {
        let params = new HttpParams().set("fulltext", name);
        let headers = this.getHeaders();

        return this.http.get<Response>(this.ServerUrl + "Friend/SearchNewFriends", { headers: headers, params: params });
    }
    /***SELF***/
    GetSelf(): Promise<Response> {
        let httpOptions = this.getHeaders();
        return this.http.get<Response>(this.ServerUrl + "Account/GetSelf", {headers: httpOptions})
            .toPromise()
            .then((response) => response);
    }

    private getHeaders() {
        let token = this.cookieService.get('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Token': token
        })
    }
}