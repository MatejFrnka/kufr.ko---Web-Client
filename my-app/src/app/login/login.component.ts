import { Component, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Server } from '../utility/server.service'
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private cookieService: CookieService, private server: Server, private router: Router) {
  }

  email: string = '';
  password: string = '';
  emailRegEx = new RegExp('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}');


  ngOnInit() {
  }

  displayError(message : string){
    let error = document.getElementById("error");
    error.innerHTML = message;
  }

  login() {
    let valid = true;
    if(!this.emailRegEx.exec(this.email)){
      valid = false;
    }
    if(this.password == undefined || this.password == null || this.password == '')
    {
      valid = false;
    }
    if (!valid)
    {
      this.displayError("Invalid login credentials");
      return;
    }
    this.server.LogIn(this.email, this.password)
      .then((response)=> {
        if(response.StatusCode == 0)
        {
        this.cookieService.set("token",  String(response.Data));
        //todo: add a place to navigate to
        this.router.navigate(['app/messages'])
        }
        else
        {
          this.displayError("Invalid login credentials");
        }
      });
  }

}
