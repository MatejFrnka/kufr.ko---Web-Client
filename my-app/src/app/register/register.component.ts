import { Component, OnInit } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Server } from "../utility/server.service";
import { Response } from "../models/response.model";
import { Router } from "@angular/router";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"]
})
export class RegisterComponent implements OnInit {
  constructor(
    private cookieService: CookieService,
    private server: Server,
    private router: Router
  ) {}

  email: string = "";
  username: string = "";
  password: string = "";
  emailRegEx = new RegExp("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}");

  ngOnInit() {}

  displayError(message: string) {
    let error = document.getElementById("error");
    error.innerHTML = message;
  }

  register() {
    document.getElementById("emailDup").classList.add("hidden");
    document.getElementById("usernameErr").classList.add("hidden");
    document.getElementById("passwordErr").classList.add("hidden");
    document.getElementById("emailDup").classList.add("hidden");
    let valid = true;
    if (!this.emailRegEx.exec(this.email)) {
      valid = false;
      console.log("asdf");
      document.getElementById("emailErr").classList.remove("hidden");
    }
    if (
      this.username == undefined ||
      this.username == null ||
      this.username == ""
    ) {
      valid = false;
      document.getElementById("usernameErr").classList.remove("hidden");
    }
    if (
      this.password == undefined ||
      this.password == null ||
      this.password == ""
    ) {
      valid = false;
      document.getElementById("passwordErr").classList.remove("hidden");
    }
    if (!valid) {
      return;
    }
    this.server
      .Register(this.email, this.password, this.username)
      .then(response => {
        if (response.StatusCode == 0) 
        {
          this.server.LogIn(this.email, this.password).then(response => {
            if (response.StatusCode == 0) {
              this.cookieService.set("token", String(response.Data));
              this.router.navigate(["app/messages"]);
            }
          });
        }
        if (response.StatusCode == 11)
          document.getElementById("emailDup").classList.remove("hidden");
      });
  }
}
