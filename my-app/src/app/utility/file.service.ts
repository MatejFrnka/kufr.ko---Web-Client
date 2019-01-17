import { Server } from './server.service';

export class FileService {
    constructor(private server: Server) { }
    getBase64(file): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    sendFile(file: File): Promise<number> {
        let base64: string;
        return this.getBase64(file).then(data => {
            base64 = data
            console.log(base64);
            return this.server.UploadAttachment(base64).then((response) => {
                console.log(response.Data);
                return 1;
            })
        });
        

        //this.server.AttachmentExists("");

    }
    getFile(fileId: number) {

    }
}