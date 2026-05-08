"""saved jobs

Revision ID: 0003_saved_jobs
Revises: 0002_external_accounts
Create Date: 2026-05-01
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_saved_jobs"
down_revision = "0002_external_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "saved_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False, server_default="remote"),
        sa.Column("job_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("company", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("location", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("url", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_saved_jobs_user_id", "saved_jobs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_saved_jobs_user_id", table_name="saved_jobs")
    op.drop_table("saved_jobs")

