from sqlalchemy import Column, Integer, String
from app.database import Base
import bcrypt

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    def set_password(self, plain_password: str):
        """Hash and store the password using bcrypt."""
        self.password = bcrypt.hashpw(
            plain_password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, plain_password: str) -> bool:
        """Verify the given password against the stored hash."""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            self.password.encode('utf-8')
        )