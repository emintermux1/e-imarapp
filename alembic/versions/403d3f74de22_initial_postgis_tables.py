"""initial postgis tables

Revision ID: 403d3f74de22
Revises: 
Create Date: 2026-05-08 14:13:14.691318+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '403d3f74de22'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create PostGIS extension
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    
    # Create municipalities table
    op.create_table('municipalities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('province', sa.String(), nullable=True),
        sa.Column('district', sa.String(), nullable=True),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('keos_url', sa.String(), nullable=True),
        sa.Column('wms_url', sa.String(), nullable=True),
        sa.Column('wfs_url', sa.String(), nullable=True),
        sa.Column('ogc_capabilities_json', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_municipalities_id'), 'municipalities', ['id'], unique=False)
    op.create_index(op.f('ix_municipalities_name'), 'municipalities', ['name'], unique=False)
    op.create_index(op.f('ix_municipalities_slug'), 'municipalities', ['slug'], unique=True)
    
    # Create parcels table
    op.create_table('parcels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('province', sa.String(), nullable=True),
        sa.Column('district', sa.String(), nullable=True),
        sa.Column('municipality', sa.String(), nullable=True),
        sa.Column('ada', sa.String(), nullable=False),
        sa.Column('parsel', sa.String(), nullable=False),
        sa.Column('geom', Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.Column('tapu_status', sa.String(), nullable=True),
        sa.Column('nitelik', sa.String(), nullable=True),
        sa.Column('alan_m2', sa.Float(), nullable=True),
        sa.Column('mahalle', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_parcels_id'), 'parcels', ['id'], unique=False)
    op.create_index(op.f('ix_parcels_province'), 'parcels', ['province'], unique=False)
    op.create_index(op.f('ix_parcels_district'), 'parcels', ['district'], unique=False)
    op.create_index(op.f('ix_parcels_municipality'), 'parcels', ['municipality'], unique=False)
    
    # Create plans table
    op.create_table('plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('municipality_id', sa.Integer(), nullable=True),
        sa.Column('plan_type', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('geom', Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.Column('aski_start', sa.Date(), nullable=True),
        sa.Column('aski_end', sa.Date(), nullable=True),
        sa.Column('pdf_url', sa.String(), nullable=True),
        sa.Column('gml_url', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plans_id'), 'plans', ['id'], unique=False)
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # Create watchlist table
    op.create_table('watchlist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parcel_id', sa.Integer(), nullable=True),
        sa.Column('plan_id', sa.Integer(), nullable=True),
        sa.Column('geom_wkt', sa.String(), nullable=True),
        sa.Column('notification_channels', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_watchlist_id'), 'watchlist', ['id'], unique=False)
    
    # Create reports table
    op.create_table('reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parcel_id', sa.Integer(), nullable=True),
        sa.Column('plan_id', sa.Integer(), nullable=True),
        sa.Column('pdf_path', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reports_id'), 'reports', ['id'], unique=False)
    
    # Create query_logs table
    op.create_table('query_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('query_type', sa.String(), nullable=True),
        sa.Column('params', sa.String(), nullable=True),
        sa.Column('results_count', sa.Integer(), nullable=True),
        sa.Column('geom', Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_query_logs_id'), 'query_logs', ['id'], unique=False)
    
    # Create additional indexes
    op.create_index('ix_parcels_ada_parsel', 'parcels', ['ada', 'parsel'], unique=False)
    op.create_index('ix_municipalities_province', 'municipalities', ['province'], unique=False)
    op.create_index('ix_municipalities_district', 'municipalities', ['district'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('ix_municipalities_district', table_name='municipalities')
    op.drop_index('ix_municipalities_province', table_name='municipalities')
    op.drop_index('ix_parcels_ada_parsel', table_name='parcels')
    
    # Drop tables
    op.drop_index(op.f('ix_query_logs_id'), table_name='query_logs')
    op.drop_table('query_logs')
    
    op.drop_index(op.f('ix_reports_id'), table_name='reports')
    op.drop_table('reports')
    
    op.drop_index(op.f('ix_watchlist_id'), table_name='watchlist')
    op.drop_table('watchlist')
    
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    op.drop_index(op.f('ix_plans_id'), table_name='plans')
    op.drop_table('plans')
    
    op.drop_index(op.f('ix_parcels_municipality'), table_name='parcels')
    op.drop_index(op.f('ix_parcels_district'), table_name='parcels')
    op.drop_index(op.f('ix_parcels_province'), table_name='parcels')
    op.drop_index(op.f('ix_parcels_id'), table_name='parcels')
    op.drop_table('parcels')
    
    op.drop_index(op.f('ix_municipalities_slug'), table_name='municipalities')
    op.drop_index(op.f('ix_municipalities_name'), table_name='municipalities')
    op.drop_index(op.f('ix_municipalities_id'), table_name='municipalities')
    op.drop_table('municipalities')
    
    # Drop PostGIS extension
    op.execute("DROP EXTENSION IF EXISTS postgis")