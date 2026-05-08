"""external accounts

Revision ID: 0002_external_accounts
Revises: 0001_initial
Create Date: 2026-05-01
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_external_accounts"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "external_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("provider_user_email", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("access_token", sa.Text(), nullable=False, server_default=""),
        sa.Column("refresh_token", sa.Text(), nullable=False, server_default=""),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "provider", name="uq_external_accounts_user_provider"),
    )
    op.create_index("ix_external_accounts_user_id", "external_accounts", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_external_accounts_user_id", table_name="external_accounts")
    op.drop_table("external_accounts")

