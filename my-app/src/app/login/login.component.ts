import { Component, OnInit, ɵConsole } from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { Server } from "../utility/server.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  constructor(
    private cookieService: CookieService,
    private server: Server,
    private router: Router
  ) {}

  email: string = "";
  password: string = "";
  emailRegEx = new RegExp("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}");

  ngOnInit() {}

  displayError(message: string) {
    let error = document.getElementById("error");
    error.innerHTML = message;
  }

  login() {
    if (!this.emailRegEx.exec(this.email)) {
      this.displayError("Invalid email");
      return;
    }
    if (
      this.password == undefined ||
      this.password == null ||
      this.password == ""
    ) {
      this.displayError("Invalid password");
    }
    this.server.LogIn(this.email, this.password).then(response => {
      if (response.StatusCode == 0) {
        this.cookieService.set("token", String(response.Data), null, "/");
        this.router.navigate(["app/messages"]);
      } else if (response.StatusCode == 6 || response.StatusCode == 8) {
        this.displayError("Invalid email");
      } else if (response.StatusCode == 7 || response.StatusCode == 9) {
        this.displayError("Invalid password");
      } else {
        this.displayError("Error code: " + response.StatusCode);
      }
    }).catch((error) => {
      this.displayError("Unable to connect to the server");
    });
  }
}
