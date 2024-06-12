import supervisorSocket from "../infrastructure/sockets/supervisorSocket";
import { internalResponse, Request, supervisorResponse, RequestDataString } from "../infrastructure/utils/interfaces";





export async function getRequestProcessor(request: Request): Promise<internalResponse> {

    try {
        
    const data = (request.data as RequestDataString).data;
    const message = {type:"supervisor/api", method:"GET", endpoint:data};
    const response: supervisorResponse = await supervisorSocket.sendMessage(message);
    
    
    return response

    
} catch (error: any) {
      
    return {success: false, result:null, error: {code: "-1", message: error.message}}
}
}
export async function postRequestProcessor(request: Request): Promise<internalResponse> {
    
    try {
        
        const data = (request.data as RequestDataString).data;
        const message = {type:"supervisor/api", method:"POST", endpoint:data};
        const response: supervisorResponse = await supervisorSocket.sendMessage(message);
        
        
        return response
    
        
    } catch (error: any) {
          
        return {success: false, result:null, error: {code: "-1", message: error.message}}
    }
}