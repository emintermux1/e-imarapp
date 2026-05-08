from celery import Celery
from app.celery_app import celery_app

@celery_app.task
def sync_tkgm_parcels():
    """
    Sync parcel data from TKGM.
    """
    # Implementation for syncing parcel data
    # This would typically fetch updated parcel data from TKGM
    # and update the local database
    pass

@celery_app.task
def track_eplan_aski():
    """
    Track plans in aski period from e-Plan.
    """
    # Implementation for tracking aski plans
    # This would typically fetch plans currently in aski period from e-Plan
    # and update the local database
    pass