import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UserCredentials } from '../models/auth/user-credentials.model'
import { Response } from '../models/response.model';
import { GroupInfo } from '../models/group/group-info.model';
import { CookieService } from 'ngx-cookie-service';
import { GetMessage } from '../models/messages/get-message.model';



@Injectable()

export class Server {
    private ServerUrl = "http://localhost:49608/api/";
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
    GetGroups(): Promise<Response> {
        let httpOptions = this.getHeaders();
        return this.http.get<Response>(this.ServerUrl + "Group/GetAll", httpOptions)
            .toPromise()
            .then((response) => response);
    }
    GetMessages(groupId: number, amount: number, startId: number = 0) {
        let httpOptions = this.getHeaders();
        let getMessage = new GetMessage(groupId, startId, amount)
        return this.http.post<Response>(this.ServerUrl + "Message/GetMessages", JSON.stringify(getMessage), httpOptions)
            .toPromise()
            .then((response) => response);
    }
    private getHeaders() {
        let token = this.cookieService.get('token');
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Token': token
            })
        }
    }
}