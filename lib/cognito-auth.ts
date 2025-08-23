import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { cognitoUserPoolId, cognitoClientId } from './config';

export class CognitoAuthService {
  private userPool: CognitoUserPool;

  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: cognitoUserPoolId,
      ClientId: cognitoClientId,
    });
  }

  async signIn(username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          const idToken = session.getIdToken().getJwtToken();
          resolve(idToken);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  async signOut(): Promise<void> {
    const currentUser = this.userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
  }

  getCurrentUser() {
    return this.userPool.getCurrentUser();
  }

  isAuthenticated(): boolean {
    const currentUser = this.userPool.getCurrentUser();
    return currentUser !== null;
  }
}

export const cognitoAuth = new CognitoAuthService();
